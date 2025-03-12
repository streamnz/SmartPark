import os
import mysql.connector
from mysql.connector import Error
from cryptography.fernet import Fernet
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 解密数据库密码
def decrypt_password(encrypted_password, key):
    try:
        f = Fernet(key)
        return f.decrypt(encrypted_password.encode()).decode()
    except Exception as e:
        logger.error(f"Error decrypting password: {e}")
        raise

# 数据库连接函数
def get_db_connection():
    try:
        # 从环境变量获取数据库连接信息
        host = os.environ.get('MYSQL_HOST', 'ai-game.cfkuy6mi4nng.ap-southeast-2.rds.amazonaws.com')
        port = int(os.environ.get('MYSQL_PORT', 3306))
        database = os.environ.get('MYSQL_DATABASE', 'ai-game')
        user = os.environ.get('MYSQL_USER', 'chenghao')
        
        # 解密密码
        encrypted_password = os.environ.get('MYSQL_ENCRYPTED_PASSWORD', 'gAAAAABnSklIg3Xbtd9BLwJ_22-IFjRUqYrwkrfY9KkAZOjbxYpSZmJdrkJUGmQJPC5P2SLRGJAdtRMB-0_JV9VoNlugpXmj5w==')
        db_key = os.environ.get('MYSQL_DB_KEY', 'L3tLdmglGKFdIeYe9xHLPa_ebkN3TX-NVZGK79ExoQk=')
        
        password = decrypt_password(encrypted_password, db_key)
        
        # 建立连接
        connection = mysql.connector.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        
        if connection.is_connected():
            logger.info(f"Connected to MySQL database {database} on {host}")
            return connection
    
    except Error as e:
        logger.error(f"Error connecting to MySQL: {e}")
        return None

# 确保数据库表已创建
def ensure_tables_exist():
    try:
        connection = get_db_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        
        # 创建用户表
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # 创建停车预约表
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS parking_reservations (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            parking_lot_id VARCHAR(36) NOT NULL,
            parking_lot_name VARCHAR(255) NOT NULL,
            spot_id VARCHAR(36) NOT NULL,
            spot_type VARCHAR(50) NOT NULL,
            destination_name VARCHAR(255),
            hourly_rate DECIMAL(10, 2) NOT NULL,
            reservation_time TIMESTAMP NOT NULL,
            expiration_time TIMESTAMP NOT NULL,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        ''')
        
        connection.commit()
        logger.info("Database tables checked/created successfully")
        return True
        
    except Error as e:
        logger.error(f"Error ensuring tables exist: {e}")
        return False
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

# 保存新的预约记录
def save_reservation(reservation_data):
    try:
        connection = get_db_connection()
        if connection is None:
            return {"status": "error", "message": "Could not connect to database"}
        
        cursor = connection.cursor()
        
        # 准备SQL语句
        sql = '''
        INSERT INTO parking_reservations (
            id, user_id, parking_lot_id, parking_lot_name, spot_id, 
            spot_type, destination_name, hourly_rate, reservation_time, 
            expiration_time, status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        '''
        
        # 生成唯一ID
        import uuid
        reservation_id = str(uuid.uuid4())
        
        # 准备值
        values = (
            reservation_id,
            reservation_data['user_id'],
            reservation_data['parking_lot_id'],
            reservation_data['parking_lot_name'],
            reservation_data['spot_id'],
            reservation_data['spot_type'],
            reservation_data.get('destination_name', ''),
            float(reservation_data['hourly_rate']),
            reservation_data['reservation_time'],
            reservation_data['expiration_time'],
            reservation_data.get('status', 'active')
        )
        
        cursor.execute(sql, values)
        connection.commit()
        
        return {
            "status": "success", 
            "message": "Reservation saved successfully",
            "data": {
                "id": reservation_id
            }
        }
        
    except Error as e:
        logger.error(f"Error saving reservation: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

# 获取用户的所有预约记录
def get_user_reservations(user_id):
    try:
        connection = get_db_connection()
        if connection is None:
            return {"status": "error", "message": "Could not connect to database"}
        
        cursor = connection.cursor(dictionary=True)
        
        # 准备SQL语句
        sql = '''
        SELECT * FROM parking_reservations 
        WHERE user_id = %s 
        ORDER BY reservation_time DESC
        '''
        
        cursor.execute(sql, (user_id,))
        reservations = cursor.fetchall()
        
        return {
            "status": "success",
            "data": reservations
        }
        
    except Error as e:
        logger.error(f"Error getting reservations: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

# 取消预约
def cancel_reservation(reservation_id):
    try:
        connection = get_db_connection()
        if connection is None:
            return {"status": "error", "message": "Could not connect to database"}
        
        cursor = connection.cursor()
        
        # 准备SQL语句
        sql = '''
        UPDATE parking_reservations 
        SET status = 'canceled' 
        WHERE id = %s
        '''
        
        cursor.execute(sql, (reservation_id,))
        connection.commit()
        
        return {
            "status": "success",
            "message": "Reservation canceled successfully"
        }
        
    except Error as e:
        logger.error(f"Error canceling reservation: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

# 初始化数据库表
if __name__ == "__main__":
    ensure_tables_exist() 