import React, { useEffect, useRef, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import AltRouteIcon from "@mui/icons-material/AltRoute";

function Login() {
  const { login } = useAuth();
  const theme = useTheme();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:960px)");

  // 创建动态背景动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isMobile) return; // 移动端不初始化Canvas以节省资源

    const ctx = canvas.getContext("2d");
    let particles = [];

    // 设置canvas尺寸
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // 粒子类
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(79, 195, 247, 0.6)";
        ctx.fill();
      }
    }

    // 创建粒子
    for (let i = 0; i < 50; i++) {
      particles.push(new Particle());
    }

    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 更新和绘制粒子
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      // 绘制连接线
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle =
              "rgba(79, 195, 247," + 0.2 * (1 - distance / 100) + ")";
            ctx.stroke();
          }
        });
      });

      // 绘制停车场图案
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);

      // 绘制停车场标志
      ctx.beginPath();
      ctx.rect(-30, -40, 60, 80);
      ctx.strokeStyle = "rgba(79, 195, 247, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // 绘制"P"字母
      ctx.font = "bold 50px Arial";
      ctx.fillStyle = "rgba(79, 195, 247, 0.8)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("P", 0, 0);

      // 绘制环绕的圆圈
      const time = Date.now() * 0.001;
      for (let i = 0; i < 3; i++) {
        const angle = time + (i * Math.PI * 2) / 3;
        const x = Math.cos(angle) * 60;
        const y = Math.sin(angle) * 60;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(79, 195, 247, 0.6)";
        ctx.fill();
      }

      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMobile]);

  // 特性列表数据
  const features = useMemo(
    () => [
      {
        icon: <DirectionsCarIcon />,
        title: "AI Navigation",
        desc: "Smart routing to the best parking spots",
      },
      {
        icon: <SmartphoneIcon />,
        title: "Real-time Updates",
        desc: "Live parking availability information",
      },
      {
        icon: <LocalParkingIcon />,
        title: "Easy Parking",
        desc: "Guided assistance for perfect parking",
      },
      {
        icon: <AltRouteIcon />,
        title: "Multiple Options",
        desc: "Find the best spot for your needs",
      },
    ],
    []
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d3436 100%)",
        position: "relative",
        overflow: "hidden",
        touchAction: "manipulation", // 优化触摸体验
      }}
    >
      {/* 添加viewport meta标签通过CSS */}
      <Box
        sx={{
          "&::before": {
            content: '""',
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: -2,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: isMobile ? 0.12 : 0,
            backgroundImage: isMobile
              ? "url('/images/parking-bg-mobile.jpg')"
              : "none",
          },
        }}
      />

      {/* 背景动画元素 */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: isMobile ? 0.05 : 0.1,
          background:
            "radial-gradient(circle at 20% 20%, rgba(62, 184, 255, 0.2) 0%, transparent 50%), " +
            "radial-gradient(circle at 80% 80%, rgba(99, 255, 147, 0.2) 0%, transparent 50%)",
          animation: "pulse 8s ease-in-out infinite",
          "@keyframes pulse": {
            "0%": { opacity: isMobile ? 0.05 : 0.1 },
            "50%": { opacity: isMobile ? 0.08 : 0.2 },
            "100%": { opacity: isMobile ? 0.05 : 0.1 },
          },
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          height: "100vh",
          position: "relative",
          px: isMobile ? 2 : 3, // 移动端减小内边距
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 导航栏 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: isMobile ? 1.5 : 2,
            mb: isMobile ? 1 : 0,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: isMobile ? "1.2rem" : "1.5rem",
            }}
          >
            <LocalParkingIcon sx={{ fontSize: isMobile ? 24 : 32 }} />
            SmartPark
          </Typography>
        </Box>

        {/* 主要内容区域 */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            flex: 1,
            gap: isMobile ? 2 : 4,
            py: isMobile ? 1 : 4,
            overflow: "auto", // 允许滚动
          }}
        >
          {/* 左侧文本区域 */}
          <Box
            sx={{
              flex: 1,
              textAlign: { xs: "center", md: "left" },
              maxWidth: { xs: "100%", md: "50%" }, // 移动端占满宽度
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                color: "white",
                mb: isMobile ? 2 : 3,
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3.5rem" }, // 更细致的响应式字体
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                lineHeight: isMobile ? 1.2 : 1.1, // 调整行高
              }}
            >
              Smart Parking
              <br />
              Made Simple
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: "rgba(255,255,255,0.8)",
                mb: isMobile ? 2 : 4,
                lineHeight: 1.6,
                maxWidth: "600px",
                fontSize: { xs: "1rem", sm: "1.25rem" }, // 移动端文字略小
                mx: { xs: "auto", md: 0 }, // 居中对齐
              }}
            >
              Experience the future of parking with AI-powered guidance and
              real-time navigation.
            </Typography>

            {/* 移动端显示分割线 */}
            {isMobile && (
              <Divider
                sx={{
                  my: 2,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  width: "80%",
                  mx: "auto",
                }}
              />
            )}

            {/* 特性列表 */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)", // 移动端默认两列
                  sm: "repeat(2, 1fr)",
                },
                gap: { xs: 1.5, sm: 2, md: 3 }, // 根据屏幕尺寸调整间距
                mb: { xs: 3, md: 4 },
                mt: isMobile ? 0 : 2,
              }}
            >
              {features.map((feature, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: { xs: 1.5, sm: 2 }, // 移动端内边距更小
                    bgcolor: "rgba(255,255,255,0.05)",
                    borderRadius: 2,
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      bgcolor: "rgba(255,255,255,0.08)",
                    },
                    "&:active": {
                      // 触摸反馈
                      transform: "scale(0.98)",
                      transition: "transform 0.1s",
                    },
                    height: "100%", // 统一高度
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    sx={{
                      color: "#4fc3f7",
                      mb: 1,
                      fontSize: isMobile ? "1.2rem" : "1.5rem",
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: "white",
                      fontWeight: 600,
                      mb: 0.5,
                      fontSize: isMobile ? "0.9rem" : "1rem",
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
                      lineHeight: 1.4,
                    }}
                  >
                    {feature.desc}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* 登录按钮 */}
            <Button
              variant="contained"
              size={isMobile ? "medium" : "large"}
              onClick={login}
              sx={{
                py: isMobile ? 1 : 1.5,
                px: isMobile ? 3 : 4,
                fontSize: isMobile ? "0.95rem" : "1.1rem",
                textTransform: "none",
                borderRadius: isMobile ? 2.5 : 2, // 移动端圆角稍大
                background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                boxShadow: "0 3px 15px rgba(33, 203, 243, 0.3)",
                width: isMobile ? "100%" : "auto", // 移动端按钮宽度占满
                mb: isMobile ? 4 : 0, // 移动端底部边距
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 20px rgba(33, 203, 243, 0.4)",
                },
                "&:active": {
                  // 触摸响应
                  transform: "translateY(1px)",
                  boxShadow: "0 2px 8px rgba(33, 203, 243, 0.3)",
                  transition: "all 0.1s ease",
                },
                transition: "all 0.3s ease",
                userSelect: "none", // 防止文本选择
                WebkitTapHighlightColor: "transparent", // 移除iOS点击高亮
              }}
            >
              Get Started with AWS Cognito
            </Button>
          </Box>

          {/* 右侧动画区域 */}
          <Box
            sx={{
              flex: 1,
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              height: "500px",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.02)",
              }}
            />
          </Box>

          {/* 只在平板设备上显示简单的停车图标 */}
          {isTablet && !isMobile && (
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                justifyContent: "center",
                alignItems: "center",
                py: 3,
              }}
            >
              <LocalParkingIcon
                sx={{
                  fontSize: 120,
                  color: "rgba(33, 150, 243, 0.6)",
                  filter: "drop-shadow(0 0 12px rgba(33, 150, 243, 0.4))",
                }}
              />
            </Box>
          )}
        </Box>

        {/* 移动端底部版权信息 */}
        {isMobile && (
          <Box
            sx={{
              py: 2,
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.7rem",
              }}
            >
              © 2023 SmartPark. All rights reserved.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default Login;
