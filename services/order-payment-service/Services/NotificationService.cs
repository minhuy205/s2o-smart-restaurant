using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;

namespace OrderPaymentService.Services
{
    public class NotificationService
    {
        public NotificationService()
        {
            // Kiểm tra xem Firebase đã khởi tạo chưa để tránh lỗi
            if (FirebaseApp.DefaultInstance == null)
            {
                try 
                {
                    // Đọc file key từ thư mục gốc của ứng dụng
                    using var stream = File.OpenRead("firebase-key.json");
                    
                    FirebaseApp.Create(new AppOptions()
                    {
                        Credential = GoogleCredential.FromStream(stream)
                    });
                    
                    Console.WriteLine("--> Firebase Admin SDK Initialized Successfully.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Error init Firebase: {ex.Message}");
                    Console.WriteLine("--> Hãy chắc chắn bạn đã copy file 'firebase-key.json' vào thư mục gốc của Service.");
                }
            }
        }

        public async Task SendOrderCompletedAsync(string deviceToken, int orderId, string itemName)
        {
             if (string.IsNullOrEmpty(deviceToken)) 
             {
                 Console.WriteLine("--> DeviceToken is null/empty. Cannot send notification.");
                 return;
             }

             // TẠO LINK ĐỂ MỞ KHI BẤM VÀO THÔNG BÁO
             // (Thay localhost bằng IP thật nếu bạn test trên điện thoại thật cùng mạng WiFi)
             string clickUrl = $"http://localhost:3000/history?orderId={orderId}";

             var message = new Message()
             {
                 Token = deviceToken,
                 
                 // 1. Phần hiển thị thông báo
                 Notification = new Notification()
                 {
                     Title = "Món ăn đã sẵn sàng! 🍜",
                     Body = $"Món {itemName} (Đơn #{orderId}) đã nấu xong. Mời bạn dùng bữa! ❤️"
                 },

                 // 2. Phần dữ liệu ngầm (Quan trọng để xử lý Click)
                 Data = new Dictionary<string, string>()
                 {
                     { "click_action", clickUrl }, // Frontend sẽ dùng cái này để redirect
                     { "orderId", orderId.ToString() }
                 }
             };

             try
             {
                 string response = await FirebaseMessaging.DefaultInstance.SendAsync(message);
                 Console.WriteLine($"--> Sent notification successfully: {response}");
             }
             catch (Exception ex)
             {
                 Console.WriteLine($"⚠️ Error sending notification: {ex.Message}");
             }
        }
    }
}