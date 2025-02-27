# Backend/tests/test_deepseek_api.py
from openai import OpenAI
import os
import sys
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 验证环境变量
api_key = os.getenv('DEEPSEEK_API_KEY')
if not api_key:
    raise ValueError("错误: 未找到DEEPSEEK_API_KEY环境变量。请在.env文件中设置。")

# 初始化客户端
client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

def test_deepseek_chat():
    print("开始测试Deepseek API...")
    
    try:
        # 第一轮对话
        messages = [{"role": "user", "content": "世界上最高的山是什么?"}]
        print(f"用户问题: {messages[0]['content']}")
        
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=messages
        )
        
        assistant_response = response.choices[0].message.content
        messages.append({"role": "assistant", "content": assistant_response})
        print(f"Deepseek回答: {assistant_response}")
        print("\n" + "-"*50 + "\n")
        
        # 第二轮对话
        messages.append({"role": "user", "content": "第二高的是什么?"})
        print(f"用户问题: {messages[-1]['content']}")
        
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=messages
        )
        
        assistant_response = response.choices[0].message.content
        messages.append({"role": "assistant", "content": assistant_response})
        print(f"Deepseek回答: {assistant_response}")
        
        print("\n完整对话历史:")
        for i, msg in enumerate(messages):
            role = "用户" if msg["role"] == "user" else "AI"
            content = msg["content"]
            print(f"{i+1}. [{role}]: {content[:100]}..." if len(content) > 100 else f"{i+1}. [{role}]: {content}")
        
        return True
    
    except Exception as e:
        print(f"测试过程中发生错误: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_deepseek_chat()
    if success:
        print("\n✅ 测试成功!")
    else:
        print("\n❌ 测试失败!") 