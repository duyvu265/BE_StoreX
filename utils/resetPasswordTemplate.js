export function getResetPasswordEmailTemplate({ user, resetLink }) {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu - StoreX</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                overflow: hidden;
            }
            .email-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            .email-header h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            .email-header p {
                font-size: 16px;
                opacity: 0.9;
            }
            .email-body {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 18px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 20px;
            }
            .content {
                font-size: 16px;
                color: #555555;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                text-align: center;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            }
            .reset-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
            .button-container {
                text-align: center;
                margin: 30px 0;
            }
            .alternative-link {
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                padding: 20px;
                margin: 30px 0;
            }
            .alternative-link p {
                font-size: 14px;
                color: #6c757d;
                margin-bottom: 10px;
            }
            .alternative-link a {
                color: #667eea;
                word-break: break-all;
                font-size: 14px;
            }
            .warning-box {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 20px;
                margin: 30px 0;
            }
            .warning-box .warning-icon {
                color: #f39c12;
                font-size: 20px;
                margin-right: 10px;
            }
            .warning-box p {
                color: #856404;
                font-size: 14px;
                margin: 0;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            .footer p {
                color: #6c757d;
                font-size: 14px;
                margin-bottom: 10px;
            }
            .footer .company-info {
                font-weight: 600;
                color: #495057;
            }
            .security-tips {
                background-color: #e8f4fd;
                border: 1px solid #b8daff;
                border-radius: 6px;
                padding: 20px;
                margin: 30px 0;
            }
            .security-tips h3 {
                color: #0c5460;
                font-size: 16px;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
            }
            .security-tips ul {
                color: #0c5460;
                font-size: 14px;
                padding-left: 20px;
            }
            .security-tips li {
                margin-bottom: 8px;
            }
            @media only screen and (max-width: 600px) {
                .email-container {
                    margin: 0;
                    border-radius: 0;
                }
                .email-header, .email-body, .footer {
                    padding: 20px;
                }
                .email-header h1 {
                    font-size: 24px;
                }
                .reset-button {
                    display: block;
                    width: 100%;
                    text-align: center;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Header -->
            <div class="email-header">
                <h1>🔐 StoreX</h1>
                <p>Yêu cầu đặt lại mật khẩu</p>
            </div>
            <!-- Body -->
            <div class="email-body">
                <div class="greeting">
                    Xin chào ${user.fullName || user.username || 'bạn'},
                </div>
                <div class="content">
                    Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản StoreX của bạn. 
                    Để bảo mật tài khoản, vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới.
                </div>
                <div class="button-container">
                    <a href="${resetLink}" class="reset-button">
                        🔑 Đặt lại mật khẩu
                    </a>
                </div>
                <div class="alternative-link">
                    <p><strong>Nút không hoạt động?</strong> Sao chép và dán liên kết sau vào trình duyệt:</p>
                    <a href="${resetLink}">${resetLink}</a>
                </div>
                <div class="warning-box">
                    <p>
                        <span class="warning-icon">⚠️</span>
                        <strong>Lưu ý quan trọng:</strong> Liên kết này sẽ hết hạn sau 15 phút kể từ khi nhận email này. 
                        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                    </p>
                </div>
                <div class="security-tips">
                    <h3>🛡️ Mẹo bảo mật:</h3>
                    <ul>
                        <li>Sử dụng mật khẩu mạnh có ít nhất 8 ký tự</li>
                        <li>Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                        <li>Không chia sẻ mật khẩu với bất kỳ ai</li>
                        <li>Thay đổi mật khẩu định kỳ để bảo vệ tài khoản</li>
                    </ul>
                </div>
            </div>
            <!-- Footer -->
            <div class="footer">
                <p class="company-info">StoreX - Nền tảng thương mại điện tử hàng đầu</p>
                <p>Email này được gửi tự động, vui lòng không trả lời trực tiếp.</p>
                <p>Nếu cần hỗ trợ, liên hệ: <a href="mailto:support@storex.com">support@storex.com</a></p>
                <p style="margin-top: 20px; font-size: 12px;">
                    © ${new Date().getFullYear()} StoreX. Tất cả quyền được bảo lưu.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
} 