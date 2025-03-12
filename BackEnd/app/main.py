from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .api import users, auth, vehicles, destinations, routes, parking_lots
from .api import parking_ai  # 导入新创建的停车场AI推荐模块
from .database.db import init_db
import logging

# 设置日志记录
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SmartPark API", description="智能停车应用API服务", version="1.0.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化数据库
@app.on_event("startup")
async def startup_db_client():
    logger.info("正在初始化数据库连接...")
    await init_db()
    logger.info("数据库连接初始化完成")

# 注册API路由
app.include_router(auth.router, prefix="/api", tags=["身份验证"])
app.include_router(users.router, prefix="/api/users", tags=["用户"])
app.include_router(vehicles.router, prefix="/api/vehicles", tags=["车辆"])
app.include_router(destinations.router, prefix="/api/destinations", tags=["目的地"])
app.include_router(routes.router, prefix="/api/routes", tags=["路线"])
app.include_router(parking_lots.router, prefix="/api/parking-lots", tags=["停车场"])
app.include_router(parking_ai.router, prefix="/api", tags=["AI停车推荐"])  # 注册新的路由器

@app.get("/", tags=["健康检查"])
async def root():
    return {"message": "SmartPark API 服务正常运行中"}

# 可选：添加健康检查端点
@app.get("/health", tags=["健康检查"])
async def health_check():
    return {"status": "healthy", "version": "1.0.0"} 