from docx import Document
from docx.shared import Pt, Inches

doc = Document()

style = doc.styles['Normal']
font = style.font
font.name = 'Times New Roman'
font.size = Pt(26)
style.paragraph_format.line_spacing = 1.1

def add_heading(text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    return p

def add_content(text, level=1):
    p = doc.add_paragraph(text)
    p.paragraph_format.left_indent = Inches(0.5 * level)
    return p

add_heading("I. Tên đề tài")
add_content("Lập trình tác tử AI chơi xếp hình (N-Puzzle) bằng thuật toán tìm kiếm A* kết hợp hàm Heuristic học từ Mạng Nơ-ron và Tối ưu hóa bằng thuật toán Tiến hóa (GA/DE).")

add_heading("II. Ý tưởng đề tài")
add_content("Thay vì sử dụng các hàm Heuristic đánh giá chi phí truyền thống do con người tự thiết kế (như khoảng cách Manhattan) cho thuật toán tìm kiếm A*, đề tài hướng tới việc để AI tự \"học\" ra một hàm Heuristic hiệu quả hơn thông qua Mạng Nơ-ron nhân tạo (Neural Network). Nhằm tối ưu hóa tập tham số trọng số của Mạng Nơ-ron mà không cần đến dữ liệu gán nhãn khổng lồ, dự án sử dụng các thuật toán tiến hóa (Genetic Algorithm - GA hoặc Differential Evolution - DE). Quá trình này giúp AI đánh giá và dự đoán các trạng thái của bàn cờ chính xác hơn, từ đó giảm thiểu đáng kể không gian tìm kiếm (số lượng nodes cần duyệt) để tìm ra lời giải tối ưu.")

add_heading("III. Các bước thực hiện")
add_content("1. Giai đoạn 1: Xây dựng môi trường bài toán & Thuật toán cốt lõi")
add_content("- Xây dựng lớp biểu diễn trạng thái vật lý của bài toán xếp hình (hỗ trợ cả 8-puzzle và 15-puzzle), sinh trạng thái kế tiếp và kiểm tra đích.", 2)
add_content("- Cài đặt thuật toán tìm kiếm A* cơ bản với hàm Heuristic Manhattan để làm mốc cơ sở (baseline) đối chiếu sau này.", 2)

add_content("2. Giai đoạn 2: Thiết kế Mạng Nơ-ron & Huấn luyện Tiến hóa")
add_content("- Xây dựng cấu trúc Mạng Nơ-ron tiếp nhận đầu vào là trạng thái bàn cờ (được mã hóa dưới dạng one-hot encoding) và đầu ra là giá trị ước lượng Heuristic h(n).", 2)
add_content("- Lập trình mô-đun Tối ưu hóa (Optimizer) sử dụng thuật toán GA và DE. Cài đặt hàm đánh giá độ thích nghi (fitness function) dựa trên hiệu suất giải các câu đố ngẫu nhiên. Trọng số tốt nhất của vòng huấn luyện sẽ được trích xuất và lưu trữ.", 2)

add_content("3. Giai đoạn 3: Phát triển Hệ thống Web Ứng dụng & Trực quan hóa")
add_content("- Lập trình Backend RESTful API bằng FastAPI (Python) để xử lý logic tìm kiếm phức tạp và phục vụ dữ liệu.", 2)
add_content("- Thiết kế và lập trình giao diện Frontend bằng thư viện ReactJS với phong cách Colorful, trực quan hóa hoạt ảnh (animation) di chuyển của từng khối gạch.", 2)
add_content("- Tích hợp bảng so sánh hiệu suất theo thời gian thực (số nodes mở rộng, tổng số bước, thời gian thực thi) giữa phương pháp Manhattan truyền thống và Mạng Nơ-ron.", 2)

add_heading("IV. Tài liệu Training & Kết quả đầu ra")
add_content("1. Tài liệu Training")
add_content("- Hình ảnh minh họa: (Bạn chèn ảnh terminal lúc chạy lệnh train vào đây nhé).", 2)
add_content("- Chú thích ảnh: Log quá trình thuật toán Differential Evolution (DE) tiến hóa và tìm kiếm tập trọng số tối ưu qua các thế hệ.", 2)

add_content("2. Kết quả đầu ra")
add_content("- Hình ảnh minh họa: (Bạn chèn ảnh giao diện web lúc giải đố xong vào đây nhé).", 2)
add_content("- Nhận xét: Nhìn vào kết quả đối chiếu, thuật toán A* sử dụng NN Heuristic có số lượng nodes cần mở rộng ít hơn hẳn so với Manhattan truyền thống. Điều này chứng minh quá trình huấn luyện đã thành công, AI đã học được cách định hướng đường đi thông minh hơn để tiến tới đích.", 2)

doc.save("Bao_Cao_AI_Puzzle.docx")
print("Đã tạo thành công file Bao_Cao_AI_Puzzle.docx!")
