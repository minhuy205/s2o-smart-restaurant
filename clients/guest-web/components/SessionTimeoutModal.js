import React from 'react';

const SessionTimeoutModal = ({ onReload }) => {
    return (
        <>
            <div className="timeout-modal-overlay">
                <div className="timeout-modal-content">
                    {/* Icon đồng hồ với hiệu ứng đổ bóng */}
                    <div className="timeout-modal-icon">⏳</div>
                    
                    <h3 className="timeout-modal-title">Phiên làm việc hết hạn</h3>
                    
                    <p className="timeout-modal-message">
                        Bạn đã không thao tác trong một khoảng thời gian dài. <br/>
                        Vui lòng tải lại trang để tiếp tục đặt món nhé!
                    </p>

                    <button 
                        className="timeout-modal-btn"
                        onClick={onReload}
                    >
                        Đồng ý & Tải lại
                    </button>
                </div>
            </div>

            <style jsx>{`
                .timeout-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7); /* Nền tối để nổi bật modal */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 100000;
                    /* QUAN TRỌNG: Hiệu ứng blur này giúp modal sắc nét và hết mờ */
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                }

                .timeout-modal-content {
                    background-color: #ffffff;
                    width: 90%;
                    max-width: 400px;
                    padding: 40px 30px;
                    border-radius: 24px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                    /* Đổ bóng sâu để tạo độ nổi khối */
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: modalPopUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .timeout-modal-icon {
                    font-size: 60px;
                    margin-bottom: 5px;
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
                }

                .timeout-modal-title {
                    margin: 0;
                    color: #1a1a1a;
                    font-size: 24px;
                    font-weight: 800;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                .timeout-modal-message {
                    color: #666;
                    font-size: 16px;
                    line-height: 1.6;
                    margin: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                .timeout-modal-btn {
                    background-color: #FF5722; /* Màu cam chủ đạo */
                    color: white;
                    border: none;
                    padding: 16px 30px;
                    border-radius: 50px;
                    font-weight: 700;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 15px;
                    width: 100%;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 15px rgba(255, 87, 34, 0.3);
                }

                .timeout-modal-btn:hover {
                    background-color: #e64a19;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 87, 34, 0.4);
                }

                .timeout-modal-btn:active {
                    transform: translateY(0);
                }

                @keyframes modalPopUp {
                    from { 
                        transform: scale(0.8) translateY(20px); 
                        opacity: 0; 
                    }
                    to { 
                        transform: scale(1) translateY(0); 
                        opacity: 1; 
                    }
                }
            `}</style>
        </>
    );
};

export default SessionTimeoutModal;