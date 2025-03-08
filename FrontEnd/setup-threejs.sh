#!/bin/bash
# Three.js 依赖安装助手

echo "=========================="
echo "Three.js 安装助手"
echo "=========================="
echo "该脚本将帮助你安装Three.js和相关依赖，解决与React 19的兼容性问题"
echo ""

# 安装选项
echo "请选择安装方式:"
echo "1) 降级React到18版本并安装Three.js依赖"
echo "2) 使用legacy-peer-deps安装Three.js依赖(保留React 19)"
read -p "请输入选项 (1/2): " option

case $option in
  1)
    echo "正在降级React到18.2.0版本..."
    npm uninstall react react-dom
    npm install react@18.2.0 react-dom@18.2.0
    
    echo "安装Three.js依赖..."
    npm install three@0.157.0 @react-three/fiber@8.15.10 @react-three/drei@9.88.15
    ;;
    
  2)
    echo "使用legacy-peer-deps安装Three.js依赖..."
    npm install --legacy-peer-deps three@0.157.0 @react-three/fiber@8.15.10 @react-three/drei@9.88.15
    ;;
    
  *)
    echo "无效选项"
    exit 1
    ;;
esac

echo ""
echo "安装完成！"
echo "==========================="
echo "请创建models目录并将模型文件放入:"
mkdir -p public/models
echo "模型文件目录已创建: public/models/"
echo "请将parking.glb和car.glb模型放入此目录"
echo "==========================="
echo "访问测试页面: http://localhost:5173/test" 