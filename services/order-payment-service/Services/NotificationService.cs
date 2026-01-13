using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace OrderPaymentService.Services
{
    public class NotificationService
    {
        // Không khởi tạo trong Constructor nữa để tránh lỗi ngầm
        public NotificationService() { }

        // Hàm riêng để lấy hoặc khởi tạo Firebase App an toàn
        private FirebaseMessaging GetFirebaseMessaging()
        {
            // 1. Nếu đã có instance rồi thì dùng luôn
            if (FirebaseApp.DefaultInstance != null)
            {
                return FirebaseMessaging.DefaultInstance;
            }

            // 2. Nếu chưa có, bắt đầu khởi tạo
            string credentialPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");
            
            // Fallback nếu biến môi trường bị rỗng
            if (string.IsNullOrEmpty(credentialPath))
            {
                credentialPath = "/app/firebase-admin.json"; 
            }

            Console.WriteLine($"[FCM] 🔍 Đang tìm file key tại: {credentialPath}");

            if (!File.Exists(credentialPath))
            {
                // Kiểm tra xem có file nào trong thư mục /app không (để debug)
                Console.WriteLine($"[FCM] ❌ KHÔNG TÌM THẤY FILE KEY! Danh sách file trong /app:");
                if (Directory.Exists("/app"))
                {
                    foreach (var f in Directory.GetFiles("/app"))
                        Console.WriteLine($" - {f}");
                }
                throw new FileNotFoundException($"Không tìm thấy file JSON tại {credentialPath}");
            }

            try 
            {
                FirebaseApp.Create(new AppOptions()
                {
                    Credential = GoogleCredential.FromFile(credentialPath)
                });
                Console.WriteLine("[FCM] ✅ Khởi tạo Firebase thành công!");
                return FirebaseMessaging.DefaultInstance;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FCM] ❌ Lỗi khởi tạo Firebase: {ex.Message}");
                throw; // Ném lỗi ra để hàm gửi biết
            }
        }

        public async Task SendNotificationAsync(string deviceToken, string title, string body)
        {
             if (string.IsNullOrEmpty(deviceToken)) 
             {
                 Console.WriteLine("[FCM] ⚠️ DeviceToken trống. Bỏ qua.");
                 return;
             }

             try
             {
                 // Gọi hàm lấy Instance (sẽ tự khởi tạo nếu chưa có)
                 var messaging = GetFirebaseMessaging();

                 var message = new Message()
                 {
                     Token = deviceToken,
                     Notification = new Notification()
                     {
                         Title = title,
                         Body = body
                     },
                     Data = new Dictionary<string, string>()
                     {
                         { "click_action", "/" }
                     }
                 };

                 string response = await messaging.SendAsync(message);
                 Console.WriteLine($"[FCM] 🚀 Sent Success: {response}");
             }
             catch (Exception ex)
             {
                 // In lỗi chi tiết
                 Console.WriteLine($"[FCM] ❌ Error sending: {ex.Message}");
                 if(ex.InnerException != null)
                    Console.WriteLine($"[FCM] 🔍 Inner Error: {ex.InnerException.Message}");
             }
        }

        public async Task SendOrderCompletedAsync(string deviceToken, int orderId, string itemName)
        {
             await SendNotificationAsync(
                deviceToken,
                "Món ăn đã sẵn sàng! 🍜",
                $"{itemName} (Đơn #{orderId}) đã xong. Mời bạn thưởng thức! ❤️"
             );
        }
    }
}