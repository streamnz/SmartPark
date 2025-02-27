def generate_navigation_instructions(start_position, target_spot):
    """生成从起点到目标车位的导航指示"""
    start_row = start_position["row"]
    start_col = start_position["col"]
    target_row = target_spot["row"]
    target_col = target_spot["col"]
    
    instructions = []
    
    # 添加初始指示
    instructions.append("从当前位置开始")
    
    # 先处理行方向移动
    if target_row > start_row:
        row_diff = target_row - start_row
        if row_diff == 1:
            instructions.append("向前行驶一排")
        else:
            instructions.append(f"向前行驶{row_diff}排")
    elif target_row < start_row:
        row_diff = start_row - target_row
        if row_diff == 1:
            instructions.append("向后行驶一排")
        else:
            instructions.append(f"向后行驶{row_diff}排")
    
    # 再处理列方向移动
    if target_col > start_col:
        col_diff = target_col - start_col
        if col_diff == 1:
            instructions.append("向右行驶一列")
        else:
            instructions.append(f"向右行驶{col_diff}列")
    elif target_col < start_col:
        col_diff = start_col - target_col
        if col_diff == 1:
            instructions.append("向左行驶一列")
        else:
            instructions.append(f"向左行驶{col_diff}列")
    
    # 添加最终指示
    spot_type = target_spot["type"]
    if spot_type != "standard":
        type_names = {
            "disabled": "残障人士",
            "ev_charging": "电动车充电",
            "compact": "小型车",
            "large": "大型车"
        }
        type_name = type_names.get(spot_type, spot_type)
        instructions.append(f"您的目标是{target_spot['id']}号{type_name}车位")
    else:
        instructions.append(f"您的目标是{target_spot['id']}号车位")
    
    # 如果指示太少，添加一些细节
    if len(instructions) < 4:
        instructions.append("小心驾驶，注意周围车辆")
    
    return instructions 