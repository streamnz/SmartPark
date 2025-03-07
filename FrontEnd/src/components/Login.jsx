import React, { useEffect, useRef, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  useTheme,
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

  // 创建动态背景动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
  }, []);

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
      }}
    >
      {/* 背景动画元素 */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background:
            "radial-gradient(circle at 20% 20%, rgba(62, 184, 255, 0.2) 0%, transparent 50%), " +
            "radial-gradient(circle at 80% 80%, rgba(99, 255, 147, 0.2) 0%, transparent 50%)",
          animation: "pulse 8s ease-in-out infinite",
          "@keyframes pulse": {
            "0%": { opacity: 0.1 },
            "50%": { opacity: 0.2 },
            "100%": { opacity: 0.1 },
          },
        }}
      />

      <Container maxWidth="lg" sx={{ height: "100vh", position: "relative" }}>
        {/* 导航栏 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 2,
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
            }}
          >
            <LocalParkingIcon sx={{ fontSize: 32 }} />
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
            minHeight: "calc(100vh - 100px)",
            gap: 4,
            py: 4,
          }}
        >
          {/* 左侧文本区域 */}
          <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                color: "white",
                mb: 3,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
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
                mb: 4,
                lineHeight: 1.6,
                maxWidth: "600px",
              }}
            >
              Experience the future of parking with AI-powered guidance and
              real-time navigation.
            </Typography>

            {/* 特性列表 */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 3,
                mb: 4,
              }}
            >
              {features.map((feature, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2,
                    bgcolor: "rgba(255,255,255,0.05)",
                    borderRadius: 2,
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      bgcolor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  <Box sx={{ color: "#4fc3f7", mb: 1 }}>{feature.icon}</Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: "white", fontWeight: 600, mb: 0.5 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    {feature.desc}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* 登录按钮 */}
            <Button
              variant="contained"
              size="large"
              onClick={login}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: "1.1rem",
                textTransform: "none",
                borderRadius: 2,
                background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                boxShadow: "0 3px 15px rgba(33, 203, 243, 0.3)",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 20px rgba(33, 203, 243, 0.4)",
                },
                transition: "all 0.3s ease",
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
        </Box>
      </Container>
    </Box>
  );
}

export default Login;
