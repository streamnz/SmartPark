from openai import OpenAI
import os
import json
import random
from dotenv import load_dotenv
from utils.navigation import generate_navigation_instructions

# 加载环境变量
load_dotenv()

# 初始化DeepSeek客户端
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

def get_ai_recommendation(available_spots, vehicle_info, user_preferences, parking_lot_info):
    """使用DeepSeek API获取智能停车位推荐"""
    
    # 准备提示
    prompt = f"""
    你是一个智能停车场系统的AI助手。请为用户推荐最佳停车位。

    停车场信息:
    名称: {parking_lot_info["name"]}
    总车位数: {len(parking_lot_info["spots"])}
    可用车位数: {len(available_spots)}
    入口位置: 第{parking_lot_info["entrance"]["row"]+1}行, 第{parking_lot_info["entrance"]["col"]+1}列
    出口位置: 第{parking_lot_info["exit"]["row"]+1}行, 第{parking_lot_info["exit"]["col"]+1}列

    车辆信息:
    类型: {vehicle_info["id"]}
    名称: {vehicle_info["name"]}
    尺寸: 宽{vehicle_info["width"]}m × 长{vehicle_info["length"]}m × 高{vehicle_info["height"]}m

    用户偏好:
    优先考虑: {user_preferences.get("priority", "optimal")}
    停留时间: {user_preferences.get("stay_duration", "medium")}

    可用车位信息（只显示前5个）:
    {json.dumps(available_spots[:5], indent=2)}
    ...(共{len(available_spots)}个可用车位)

    请为此车辆和用户选择最合适的停车位。考虑以下因素:
    1. 车辆尺寸与车位的匹配度
    2. 用户偏好（如距离优先或安全优先）
    3. 车位类型与用户需求（如残障车位、电动车充电等）
    4. 停车位置与入口和出口的距离

    请返回一个JSON格式的回答，包含以下字段:
    1. selected_spot_id: 你选择的车位ID
    2. reasoning: 选择这个车位的详细理由，向用户解释你的决策
    
    仅返回JSON格式，不要有其他内容。
    """
    
    try:
        # 调用DeepSeek API
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "你是一个智能停车分配系统，使用数据分析为用户找到最佳停车位置。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        
        # 解析响应
        result_text = response.choices[0].message.content
        result = json.loads(result_text)
        
        selected_spot_id = result["selected_spot_id"]
        
        # 找到对应的车位
        selected_spot = next((spot for spot in available_spots if spot["id"] == selected_spot_id), None)
        
        # 如果找不到推荐的车位（可能是AI错误），选择一个备选车位
        if not selected_spot:
            # 按照到入口的距离排序，选择最近的
            selected_spot = sorted(available_spots, key=lambda x: x["distance_to_entrance"])[0]
            reasoning = f"系统推荐您停在{selected_spot['id']}车位，这是距离入口最近的可用车位。"
        else:
            reasoning = result["reasoning"]
        
        # 生成导航指示
        navigation_instructions = generate_navigation_instructions(
            parking_lot_info["entrance"],
            selected_spot
        )
        
        return {
            "spot": selected_spot,
            "reasoning": reasoning,
            "navigation_instructions": navigation_instructions
        }
        
    except Exception as e:
        print(f"AI推荐出错: {str(e)}")
        
        # 回退到简单算法
        if vehicle_info["id"] in ["truck", "rv"]:
            # 大型车辆优先选择大型车位或距离出口近的位置
            available_large_spots = [s for s in available_spots if s["type"] == "large"]
            if available_large_spots:
                selected_spot = available_large_spots[0]
            else:
                # 按照到出口的距离排序
                selected_spot = sorted(available_spots, key=lambda x: x["distance_to_exit"])[0]
        else:
            # 小型车辆优先选择距离入口近的位置
            selected_spot = sorted(available_spots, key=lambda x: x["distance_to_entrance"])[0]
        
        reasoning = f"为您的{vehicle_info['name']}推荐{selected_spot['id']}车位，这里{selected_spot['type'] if selected_spot['type'] != 'standard' else ''}位置适合您的车辆尺寸，且{('距离入口较近' if vehicle_info['id'] not in ['truck', 'rv'] else '便于大型车辆驶出')}。"
        
        navigation_instructions = generate_navigation_instructions(
            parking_lot_info["entrance"],
            selected_spot
        )
        
        return {
            "spot": selected_spot,
            "reasoning": reasoning,
            "navigation_instructions": navigation_instructions
        }

def reroute_recommendation(available_spots, vehicle_info, current_position, destination, parking_lot_info):
    """用户偏离路线后，重新推荐停车位"""
    
    # 将3D位置转换为停车场行列
    current_row = int(current_position[2] / 3)
    current_col = int(current_position[0] / 3)
    
    # 准备提示
    prompt = f"""
    用户正在停车场内寻找车位，但已经偏离了原定路线。请基于当前位置重新推荐一个合适的停车位。

    停车场信息:
    名称: {parking_lot_info["name"]}
    总车位数: {len(parking_lot_info["spots"])}
    可用车位数: {len(available_spots)}

    用户当前位置:
    第{current_row+1}行, 第{current_col+1}列 (大约)

    车辆信息:
    类型: {vehicle_info["id"]}
    名称: {vehicle_info["name"]}
    尺寸: 宽{vehicle_info["width"]}m × 长{vehicle_info["length"]}m × 高{vehicle_info["height"]}m

    目的地信息:
    名称: {destination.get("name", "未知")}

    可用车位信息（只显示部分）:
    {json.dumps(sorted(available_spots, key=lambda x: abs(x["row"]-current_row) + abs(x["col"]-current_col))[:5], indent=2)}
    ...(共{len(available_spots)}个可用车位)

    请重新分析并推荐一个从用户当前位置更容易到达的合适车位。优先考虑:
    1. 距离当前位置近
    2. 车辆尺寸与车位匹配
    3. 车位朝向与当前用户行驶方向一致更好
    4. 仍然保持车位与最终目的地的合理距离

    请返回一个JSON格式的回答，包含以下字段:
    1. selected_spot_id: 你选择的新车位ID
    2. reasoning: 为什么推荐这个新车位，解释重新规划的原因
    
    仅返回JSON格式，不要有其他内容。
    """
    
    try:
        # 调用DeepSeek API
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "你是一个智能停车导航系统，能够根据用户当前位置动态调整推荐。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        
        # 解析响应
        result_text = response.choices[0].message.content
        result = json.loads(result_text)
        
        selected_spot_id = result["selected_spot_id"]
        
        # 找到对应的车位
        selected_spot = next((spot for spot in available_spots if spot["id"] == selected_spot_id), None)
        
        # 如果找不到推荐的车位，选择距离当前位置最近的
        if not selected_spot:
            selected_spot = sorted(
                available_spots, 
                key=lambda x: abs(x["row"]-current_row) + abs(x["col"]-current_col)
            )[0]
            reasoning = f"基于您当前位置，系统为您推荐最近的{selected_spot['id']}车位。"
        else:
            reasoning = result["reasoning"]
        
        # 从当前位置生成导航指示
        current_position_dict = {"row": current_row, "col": current_col}
        navigation_instructions = generate_navigation_instructions(
            current_position_dict,
            selected_spot
        )
        
        return {
            "spot": selected_spot,
            "reasoning": reasoning,
            "navigation_instructions": navigation_instructions
        }
        
    except Exception as e:
        print(f"重新路由推荐出错: {str(e)}")
        
        # 回退到简单算法 - 选择距离当前位置最近的车位
        selected_spot = sorted(
            available_spots, 
            key=lambda x: abs(x["row"]-current_row) + abs(x["col"]-current_col)
        )[0]
        
        reasoning = f"基于您当前位置，为您的{vehicle_info['name']}推荐附近的{selected_spot['id']}车位。"
        
        current_position_dict = {"row": current_row, "col": current_col}
        navigation_instructions = generate_navigation_instructions(
            current_position_dict,
            selected_spot
        )
        
        return {
            "spot": selected_spot,
            "reasoning": reasoning,
            "navigation_instructions": navigation_instructions
        } 