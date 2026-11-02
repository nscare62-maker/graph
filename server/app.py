"""
FastAPI Server for Graph-Based Customer Behavior Modeling & Personalized Recommendation.
Provides REST APIs for real-time recommendation, graph visualization, interaction simulation,
and model benchmarking.
"""

import os
import json
import uuid
import datetime
from typing import Optional, List
from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from data.generator import EcommerceDataGenerator
from data.dataset import RecommendationDataset
from graph.builder import HeterogeneousGraphBuilder
from graph.visualizer import GraphVisualizer
from models.lightgcn import LightGCNRecommender
from models.ppr_recommender import PersonalizedPageRankRecommender
from models.baselines import PopularityRecommender, ItemCFRecommender, MatrixFactorizationRecommender
from models.hybrid_ranker import HybridGraphRanker
from evaluation.benchmark import ModelBenchmark

app = FastAPI(
    title="Graph-Based Recommendation System API",
    description="Customer Behavior Network Modeling with LightGCN, Personalized PageRank, and Explainable Re-ranking",
    version="1.0.0"
)

# Global State Container
class SystemState:
    def __init__(self):
        self.generator = None
        self.dataset = None
        self.builder = None
        self.visualizer = None
        self.models = {}
        self.benchmark_results = None
        self.user_live_sessions = {}  # user_id -> list of recently viewed product_ids

state = SystemState()


class InteractionRequest(BaseModel):
    user_id: str
    product_id: str
    action_type: str  # view, search_click, cart, purchase, rating
    rating_val: Optional[float] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    primary_interest: str


class CartItemRequest(BaseModel):
    user_id: str
    product_id: str


class CheckoutRequest(BaseModel):
    user_id: str


active_sessions = {}


def get_data_filepath(filename: str) -> str:
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    os.makedirs(data_dir, exist_ok=True)
    return os.path.join(data_dir, filename)


def load_accounts() -> dict:
    p = get_data_filepath("accounts.json")
    accounts = {}
    if os.path.exists(p):
        try:
            with open(p, "r", encoding="utf-8") as f:
                accounts = json.load(f)
        except Exception:
            accounts = {}
    if "admin@gmail.com" not in accounts:
        accounts["admin@gmail.com"] = {
            "email": "admin@gmail.com",
            "password": "123456",
            "role": "admin",
            "name": "System Administrator",
            "user_id": "U0001"
        }
        save_accounts(accounts)
    return accounts


def save_accounts(accounts: dict):
    p = get_data_filepath("accounts.json")
    with open(p, "w", encoding="utf-8") as f:
        json.dump(accounts, f, indent=2)


def load_json_file(filename: str) -> dict:
    p = get_data_filepath(filename)
    if os.path.exists(p):
        try:
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_json_file(filename: str, data: dict):
    p = get_data_filepath(filename)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


@app.on_event("startup")
def initialize_system():
    """Bootstraps the dataset, builds graphs, and trains GNN & baseline models."""
    print("=== Initializing Graph-Based Recommendation System ===")
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    os.makedirs(data_dir, exist_ok=True)

    users_path = os.path.join(data_dir, "users.csv")
    products_path = os.path.join(data_dir, "products.csv")
    interactions_path = os.path.join(data_dir, "interactions.csv")

    if not (os.path.exists(users_path) and os.path.exists(products_path) and os.path.exists(interactions_path)):
        print("Generating realistic synthetic e-commerce customer behavior dataset...")
        state.generator = EcommerceDataGenerator(num_users=120, num_products=60, seed=42)
        users_df, products_df, interactions_df = state.generator.generate_all(output_dir=data_dir)
    else:
        print("Loading existing dataset from data/raw...")
        import pandas as pd
        users_df = pd.read_csv(users_path)
        products_df = pd.read_csv(products_path)
        interactions_df = pd.read_csv(interactions_path)

    # 1. Dataset & Train/Test Split
    print("Splitting dataset and indexing interaction tensors...")
    state.dataset = RecommendationDataset(users_df, products_df, interactions_df)
    state.dataset.train_test_split(test_ratio=0.20, strategy="temporal")

    # 2. Graph Construction
    print("Constructing multi-relational heterogeneous graph...")
    state.builder = HeterogeneousGraphBuilder()
    state.builder.build_from_dataframes(users_df, products_df, state.dataset.train_df)
    state.visualizer = GraphVisualizer(state.builder)

    # 3. Model Training
    print("Fitting baseline models (Popularity, ItemCF, Matrix Factorization)...")
    pop_model = PopularityRecommender()
    pop_model.fit(state.dataset)

    itemcf_model = ItemCFRecommender()
    itemcf_model.fit(state.dataset)

    mf_model = MatrixFactorizationRecommender(n_components=24)
    mf_model.fit(state.dataset)

    print("Initializing Personalized PageRank graph engine...")
    ppr_model = PersonalizedPageRankRecommender(state.builder, alpha=0.85)

    print("Training LightGCN PyTorch Graph Neural Network (25 epochs)...")
    lightgcn_model = LightGCNRecommender(latent_dim=48, num_layers=3, lr=0.008)
    lightgcn_model.fit(state.dataset, epochs=25, batch_size=256, verbose=True)

    print("Building Hybrid GNN + PPR explainable ranker...")
    hybrid_model = HybridGraphRanker(lightgcn_model, ppr_model, state.builder, state.dataset)

    state.models = {
        "hybrid": hybrid_model,
        "lightgcn": lightgcn_model,
        "ppr": ppr_model,
        "itemcf": itemcf_model,
        "mf": mf_model,
        "popularity": pop_model
    }

    # 4. Run Benchmark
    print("Executing offline comparative benchmark...")
    benchmark_models = {
        "Hybrid (GNN+PPR)": hybrid_model,
        "LightGCN (GNN)": lightgcn_model,
        "Personalized PageRank": ppr_model,
        "ItemCF": itemcf_model,
        "Matrix Factorization": mf_model,
        "Popularity Baseline": pop_model
    }
    benchmark = ModelBenchmark(state.dataset, benchmark_models, k_values=[5, 10])
    state.benchmark_results = benchmark.run(max_test_users=50)
    plot_path = os.path.join(os.path.dirname(__file__), "static", "benchmark_results.png")
    benchmark.plot_comparison(plot_path)

    print("=== System Ready! All modules initialized successfully ===")


# ---------------- API ENDPOINTS ----------------

@app.get("/api/overview")
def get_overview():
    """System and Graph summary metrics."""
    stats = state.builder.get_summary_statistics()
    return {
        "status": "online",
        "dataset": {
            "num_users": state.dataset.num_users,
            "num_products": state.dataset.num_products,
            "num_categories": state.dataset.num_categories,
            "train_interactions": len(state.dataset.train_df),
            "test_interactions": len(state.dataset.test_df)
        },
        "graph": stats,
        "available_models": list(state.models.keys())
    }


@app.get("/api/users")
def get_users(limit: int = 150):
    """List available users with profile attributes."""
    df = state.dataset.users_df.copy()
    if "user_idx" in df.columns:
        df["user_idx"] = df["user_id"].map(lambda u: state.dataset.user2idx.get(u, 0)).fillna(0).astype(int)
    df = df.fillna({
        "age_group": "25-34",
        "activity_level": "medium",
        "primary_interest": "Electronics",
        "interests": "Electronics"
    }).fillna("")
    users_records = df.head(limit).to_dict("records")
    return {"users": users_records}


@app.get("/api/products")
def get_products(category: Optional[str] = None):
    """Catalog of products."""
    df = state.dataset.products_df
    if category:
        df = df[df["category"] == category]
    return {"products": df.to_dict("records")}


@app.get("/api/product/{product_id}")
def get_product_details(product_id: str):
    """Fetch detailed product attributes and behavioral statistics from graph."""
    if product_id not in state.dataset.prod2idx:
        raise HTTPException(status_code=404, detail="Product not found")

    prod_row = state.dataset.products_df[state.dataset.products_df["product_id"] == product_id].iloc[0].to_dict()

    # Calculate graph degree and edge distribution
    g = state.builder.graph
    in_edges = list(g.in_edges(product_id, data=True)) if g.has_node(product_id) else []

    interactions_count = {
        "view": sum(1 for _, _, d in in_edges if str(d.get("relation", "")).upper() == "VIEWED"),
        "search_click": sum(1 for _, _, d in in_edges if str(d.get("relation", "")).upper() == "SEARCHED"),
        "cart": sum(1 for _, _, d in in_edges if str(d.get("relation", "")).upper() == "CARTED"),
        "purchase": sum(1 for _, _, d in in_edges if str(d.get("relation", "")).upper() == "PURCHASED"),
        "total": len(in_edges)
    }

    # Co-interacted products
    co_products = []
    if g.has_node(product_id):
        user_neighbors = [u for u, _ in g.in_edges(product_id)]
        product_counts = {}
        for u in user_neighbors[:30]:
            for _, p, _ in g.out_edges(u, data=True):
                if p != product_id and g.nodes.get(p, {}).get("entity_type") == "PRODUCT":
                    product_counts[p] = product_counts.get(p, 0) + 1
        sorted_co = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        for p_id, count in sorted_co:
            p_rows = state.dataset.products_df[state.dataset.products_df["product_id"] == p_id]
            if len(p_rows) > 0:
                p_info = p_rows.iloc[0]
                co_products.append({
                    "product_id": p_id,
                    "name": p_info["name"],
                    "category": p_info["category"],
                    "price": float(p_info["price"]),
                    "co_count": count
                })

    return {
        "product": prod_row,
        "graph_stats": interactions_count,
        "co_interacted_items": co_products
    }



@app.get("/api/user/{user_id}/history")
def get_user_history(user_id: str):
    """Fetch behavioral interaction history for a selected user."""
    if user_id not in state.dataset.user2idx and not (state.builder and state.builder.graph.has_node(user_id)):
        raise HTTPException(status_code=404, detail="User not found")

    records = []
    if "user_id" in state.dataset.interactions_df.columns:
        df = state.dataset.interactions_df[state.dataset.interactions_df["user_id"] == user_id]
        if not df.empty:
            merged = df.merge(state.dataset.products_df, on="product_id", how="left")
            records = merged[["timestamp", "action_type", "product_id", "name", "category", "price", "weight"]].sort_values(by="timestamp", ascending=False).to_dict("records")

    live_context = state.user_live_sessions.get(user_id, [])

    return {
        "user_id": user_id,
        "total_interactions": len(records),
        "history": records[:20],
        "active_session_items": live_context
    }


@app.get("/api/recommendations")
def get_recommendations(
    user_id: str = Query(..., description="Target User ID e.g. U0001"),
    model_name: str = Query("hybrid", description="Model architecture: hybrid, lightgcn, ppr, itemcf, mf, popularity"),
    k: int = Query(8, ge=1, le=30),
    filter_seen: bool = Query(True)
):
    """Generate personalized recommendations for a user using selected algorithm."""
    model_key = model_name.lower()
    if model_key not in state.models:
        raise HTTPException(status_code=400, detail=f"Unknown model '{model_name}'. Available: {list(state.models.keys())}")

    model = state.models[model_key]
    recent_items = state.user_live_sessions.get(user_id, [])

    recs = []
    try:
        if model_key == "hybrid":
            recs = model.recommend(user_id, k=k, filter_interacted=filter_seen, recent_session_items=recent_items)
        elif model_key == "ppr":
            recs = model.recommend(user_id, k=k, filter_interacted=filter_seen, context_product_ids=recent_items)
        else:
            recs = model.recommend(user_id, k=k, filter_interacted=filter_seen)
    except Exception as e:
        print(f"Error computing recommendations with {model_key} for {user_id}: {e}")
        recs = []

    # If recs is empty (e.g. cold start user), fall back to Popularity
    if not recs:
        pop_model = state.models.get("popularity")
        if pop_model:
            try:
                recs = pop_model.recommend(user_id, k=k, filter_interacted=False)
            except Exception:
                pass

    return {
        "user_id": user_id,
        "model": model_key,
        "k": k,
        "active_session_items": recent_items,
        "recommendations": recs
    }


@app.post("/api/interact")
def record_interaction(payload: InteractionRequest):
    """
    Simulate live customer behavior event (View, Click, Cart, Purchase, Rate).
    Updates graph in real-time and session context.
    """
    u_id = payload.user_id
    p_id = payload.product_id
    action = payload.action_type

    if not state.builder.graph.has_node(u_id):
        raise HTTPException(status_code=404, detail="User not found")
    if not state.builder.graph.has_node(p_id):
        raise HTTPException(status_code=404, detail="Product not found")

    import datetime
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Add dynamic edge to the live graph
    state.builder.add_interaction(u_id, p_id, action, timestamp=now_str, session_id="LIVE_SESSION")

    # Update live session context
    if u_id not in state.user_live_sessions:
        state.user_live_sessions[u_id] = []
    if p_id not in state.user_live_sessions[u_id]:
        state.user_live_sessions[u_id].append(p_id)
        if len(state.user_live_sessions[u_id]) > 5:
            state.user_live_sessions[u_id].pop(0)

    # Return refreshed recommendations
    hybrid_recs = state.models["hybrid"].recommend(u_id, k=6, filter_interacted=True, recent_session_items=state.user_live_sessions[u_id])

    return {
        "status": "success",
        "message": f"Recorded '{action}' on item {p_id} for user {u_id}",
        "session_context": state.user_live_sessions[u_id],
        "refreshed_recommendations": hybrid_recs
    }


@app.get("/api/graph/user-ego")
def get_user_ego_graph(user_id: str = Query(...)):
    """Fetch Vis.js graph format for user's personal ego-network."""
    return state.visualizer.get_user_ego_network(user_id, max_items=12)


@app.get("/api/graph/sample")
def get_sample_graph():
    """Fetch sample multi-relational network for macro visualization."""
    return state.visualizer.get_sample_graph(max_users=15, max_products=25)


@app.get("/api/graph/explain")
def get_explanation_graph(user_id: str = Query(...), product_id: str = Query(...)):
    """Fetch graph explanation path between user and recommended item."""
    return state.visualizer.get_explanation_subgraph(user_id, product_id)


@app.get("/api/benchmark")
def get_benchmark_metrics():
    """Return offline comparative performance results."""
    if state.benchmark_results is None:
        return {"error": "Benchmark not available"}
    records = []
    for r in state.benchmark_results.to_dict("records"):
        rec = dict(r)
        rec["HitRate@10"] = r.get("HR@10", 0)
        rec["Precision@10"] = r.get("P@10", 0)
        rec["Recall@10"] = r.get("R@10", 0)
        rec["CatalogCoverage"] = r.get("Coverage", 0)
        records.append(rec)
    return {
        "results": records,
        "chart_url": "/static/benchmark_results.png"
    }


# =====================================================================
# Authentication & User Management Endpoints
# =====================================================================

@app.post("/api/auth/login")
def login(req: LoginRequest):
    accounts = load_accounts()
    email = req.email.strip().lower()
    acc = accounts.get(email)
    if not acc or acc.get("password") != req.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "status": "success",
        "user": {
            "email": acc["email"],
            "name": acc.get("name", "User"),
            "role": acc.get("role", "user"),
            "user_id": acc.get("user_id", "U0001"),
            "primary_interest": acc.get("primary_interest", "Electronics")
        }
    }


@app.post("/api/auth/register")
def register(req: RegisterRequest):
    email = req.email.strip().lower()
    accounts = load_accounts()
    if email in accounts:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    if len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    # Determine next sequential user ID (e.g. U0101)
    existing_uids = list(state.dataset.users_df["user_id"]) + [a.get("user_id", "") for a in accounts.values()]
    max_num = 0
    for uid in existing_uids:
        if uid.startswith("U"):
            try:
                num = int(uid[1:])
                if num > max_num:
                    max_num = num
            except ValueError:
                pass
    new_user_id = f"U{max_num + 1:04d}"
    primary_interest = req.primary_interest.strip() or "Electronics"

    # Persist account
    new_acc = {
        "email": email,
        "password": req.password,
        "role": "user",
        "name": name,
        "user_id": new_user_id,
        "primary_interest": primary_interest
    }
    accounts[email] = new_acc
    save_accounts(accounts)

    # Persist user row to users.csv
    import pandas as pd
    users_csv = get_data_filepath("users.csv")
    csv_row = pd.DataFrame([{
        "user_id": new_user_id,
        "name": name,
        "age_group": "25-34",
        "activity_level": "medium",
        "primary_interest": primary_interest,
        "interests": primary_interest
    }])
    if os.path.exists(users_csv):
        csv_row.to_csv(users_csv, mode="a", header=False, index=False)

    # Update in-memory dataset
    new_idx = len(state.dataset.user2idx)
    new_user_df = pd.DataFrame([{
        "user_id": new_user_id,
        "name": name,
        "age_group": "25-34",
        "activity_level": "medium",
        "primary_interest": primary_interest,
        "interests": primary_interest,
        "user_idx": new_idx
    }])
    state.dataset.users_df = pd.concat([state.dataset.users_df, new_user_df], ignore_index=True)
    state.dataset.user2idx[new_user_id] = new_idx
    state.dataset.idx2user[new_idx] = new_user_id

    # Add user node to live graph
    from graph.schema import NodeType
    state.builder.graph.add_node(
        new_user_id,
        entity_type=NodeType.USER.value,
        label=name,
        name=name,
        age_group="25-34",
        activity_level="medium",
        interests=primary_interest,
        title=f"User: {name} ({primary_interest})"
    )
    state.builder.undirected_graph.add_node(
        new_user_id,
        entity_type=NodeType.USER.value,
        label=name,
        name=name,
        age_group="25-34",
        activity_level="medium",
        interests=primary_interest,
        title=f"User: {name} ({primary_interest})"
    )

    # Seed initial onboarding view interactions matching customer's interest
    import datetime
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    matched = state.dataset.products_df[state.dataset.products_df["category"] == primary_interest]
    if matched.empty:
        matched = state.dataset.products_df
    seed_pids = matched.head(3)["product_id"].tolist()
    state.user_live_sessions[new_user_id] = []
    for pid in seed_pids:
        state.builder.add_interaction(new_user_id, pid, "view", timestamp=now_str, session_id="ONBOARDING")
        state.user_live_sessions[new_user_id].append(pid)

    return {
        "status": "success",
        "user": {
            "email": email,
            "name": name,
            "role": "user",
            "user_id": new_user_id,
            "primary_interest": primary_interest
        }
    }


# =====================================================================
# E-Commerce Customer Cart & Orders Endpoints
# =====================================================================

@app.get("/api/cart")
def get_cart(user_id: str = Query(...)):
    carts = load_json_file("carts.json")
    user_cart = carts.get(user_id, [])
    total_price = sum(item.get("price", 0.0) * item.get("quantity", 1) for item in user_cart)
    count = sum(item.get("quantity", 1) for item in user_cart)
    return {
        "user_id": user_id,
        "items": user_cart,
        "total_price": round(total_price, 2),
        "count": count
    }


@app.post("/api/cart/add")
def add_to_cart(req: CartItemRequest):
    u_id = req.user_id
    p_id = req.product_id

    prod_row = state.dataset.products_df[state.dataset.products_df["product_id"] == p_id]
    if prod_row.empty:
        raise HTTPException(status_code=404, detail="Product not found")
    prod = prod_row.iloc[0]

    carts = load_json_file("carts.json")
    user_cart = carts.get(u_id, [])

    found = False
    for item in user_cart:
        if item.get("product_id") == p_id:
            item["quantity"] = item.get("quantity", 1) + 1
            found = True
            break
    if not found:
        user_cart.append({
            "product_id": p_id,
            "name": prod["name"],
            "category": prod["category"],
            "price": float(prod["price"]),
            "brand": prod.get("brand", "Generic"),
            "quantity": 1
        })

    carts[u_id] = user_cart
    save_json_file("carts.json", carts)

    # Dynamic behavior edge insertion into the live graph
    import datetime
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if state.builder.graph.has_node(u_id) and state.builder.graph.has_node(p_id):
        state.builder.add_interaction(u_id, p_id, "cart", timestamp=now_str, session_id="LIVE_SESSION")

    # Update session context
    if u_id not in state.user_live_sessions:
        state.user_live_sessions[u_id] = []
    if p_id not in state.user_live_sessions[u_id]:
        state.user_live_sessions[u_id].append(p_id)
        if len(state.user_live_sessions[u_id]) > 5:
            state.user_live_sessions[u_id].pop(0)

    total_price = sum(item.get("price", 0.0) * item.get("quantity", 1) for item in user_cart)
    count = sum(item.get("quantity", 1) for item in user_cart)

    return {
        "status": "success",
        "message": f"Added '{prod['name']}' to cart",
        "cart": {
            "items": user_cart,
            "total_price": round(total_price, 2),
            "count": count
        }
    }


@app.post("/api/cart/remove")
def remove_from_cart(req: CartItemRequest):
    u_id = req.user_id
    p_id = req.product_id

    carts = load_json_file("carts.json")
    user_cart = carts.get(u_id, [])

    new_cart = []
    for item in user_cart:
        if item.get("product_id") == p_id:
            if item.get("quantity", 1) > 1:
                item["quantity"] -= 1
                new_cart.append(item)
        else:
            new_cart.append(item)

    carts[u_id] = new_cart
    save_json_file("carts.json", carts)

    total_price = sum(item.get("price", 0.0) * item.get("quantity", 1) for item in new_cart)
    count = sum(item.get("quantity", 1) for item in new_cart)

    return {
        "status": "success",
        "cart": {
            "items": new_cart,
            "total_price": round(total_price, 2),
            "count": count
        }
    }


@app.post("/api/cart/checkout")
def checkout(req: CheckoutRequest):
    u_id = req.user_id
    carts = load_json_file("carts.json")
    user_cart = carts.get(u_id, [])

    if not user_cart:
        raise HTTPException(status_code=400, detail="Shopping cart is empty")

    import datetime
    import uuid
    now = datetime.datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    order_id = f"ORD-{int(now.timestamp())}-{uuid.uuid4().hex[:4].upper()}"

    subtotal = sum(item.get("price", 0.0) * item.get("quantity", 1) for item in user_cart)
    tax = round(subtotal * 0.08, 2)
    shipping = 0.0 if subtotal > 50 else 9.99
    total = round(subtotal + tax + shipping, 2)

    order = {
        "order_id": order_id,
        "date": now_str,
        "items": user_cart,
        "item_count": sum(item.get("quantity", 1) for item in user_cart),
        "subtotal": round(subtotal, 2),
        "tax": tax,
        "shipping": shipping,
        "total": total,
        "status": "Confirmed & Processing"
    }

    # Record purchase behavior edge for each item in the live graph
    for item in user_cart:
        pid = item.get("product_id")
        if pid and state.builder.graph.has_node(u_id) and state.builder.graph.has_node(pid):
            state.builder.add_interaction(u_id, pid, "purchase", timestamp=now_str, session_id="PURCHASE_SESSION")

    # Persist order history
    orders = load_json_file("orders.json")
    user_orders = orders.get(u_id, [])
    user_orders.insert(0, order)
    orders[u_id] = user_orders
    save_json_file("orders.json", orders)

    # Empty user cart
    carts[u_id] = []
    save_json_file("carts.json", carts)

    return {
        "status": "success",
        "message": "Order placed successfully!",
        "order": order
    }


@app.get("/api/orders")
def get_orders(user_id: str = Query(...)):
    orders = load_json_file("orders.json")
    return {
        "user_id": user_id,
        "orders": orders.get(user_id, [])
    }


# Static Files & SPA Routing
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
def serve_index():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Graph Recommendation API is running. UI index.html not yet built."}
