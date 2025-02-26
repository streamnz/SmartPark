const awsExports = {
  Auth: {
    // 区域 - Sydney
    region: "ap-southeast-2",

    // Cognito User Pool ID
    userPoolId: "ap-southeast-2_BXhdoWuDl",

    // Cognito Web Client ID
    userPoolWebClientId: "4r2ui82gb5gigfrfjl18tq1i6i",

    // OAuth配置
    oauth: {
      domain: "ap-southeast-2bxhdowudl.auth.ap-southeast-2.amazoncognito.com",
      scope: ["email", "openid", "phone"],
      redirectSignIn: "http://localhost:5173/authorize",
      redirectSignOut: "http://localhost:5173/",
      responseType: "code",
    },
  },
};

export default awsExports;
