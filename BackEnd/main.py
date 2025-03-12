from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import os
from dotenv import load_dotenv
from routes import reservation_routes

# 加载环境变量
load_dotenv()

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title="SmartPark API",
    description="Backend API for SmartPark parking reservation system",
    version="1.0.0"
)

# 配置CORS - 确保每个源只有一个值
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5173,https://smartpark.example.com')
origins = ALLOWED_ORIGINS.split(',')
logger.info(f"Configuring CORS with allowed origins: {origins}")

# 正确配置CORS中间件，确保正确处理预检请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # 使用从环境变量获取的列表
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=3600,  # 预检请求结果缓存1小时
)

# 添加路由
app.include_router(reservation_routes.router)

# 健康检查路径
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# 首页路径
@app.get("/")
async def root():
    return {
        "message": "Welcome to SmartPark API",
        "documentation": "/docs",
        "cors_config": {
            "allowed_origins": origins
        }
    }

# 启动服务器
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    logger.info(f"Starting server on port {port} with CORS configured for: {origins}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 