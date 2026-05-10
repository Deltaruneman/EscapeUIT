const TILE_SIZE = 50;
const COLS = 16, ROWS = 12;

const storyScenes = [
    { img: "https://www.uit.edu.vn/_next/image?url=https%3A%2F%2Fwww.uit.edu.vn%2Fstrapi%2Fuploads%2FUIT_1_e406b7e283.jpg&w=1536&q=75", text: "Bạn là 1 sinh viên năm 4 bình thường ở UIT." },
    { img: "https://banqlcs.uit.edu.vn/sites/banqlcs/files/styles/slider/public/slider/uit_dsc_0001_web.jpg?itok=F6x8u5Oi", text: "Bạn đang làm 1 đồ án tốt nghiệp thật peak để ra trường." },
    { img: "https://dep.com.vn/wp-content/uploads/2023/07/4-14.png", text: "Bây giờ là 12 giờ đêm, bạn vẫn đang chạy deadline liên tục, quá kiệt sức bạn chìm vào 1 cơn ác mộng." },
    { img: "images/red.png",text: "Giấc mơ này thật kì lạ, xung quanh tối đen như mực và.. chờ đã cái gì đang đuổi theo bạn kia??!?!" },
    { text: "Sau khi xem xét 1 hồi, bạn nhận ra mình đang bị truy duổi bởi 1 thực thể nào đó trong 1 khu vực tối tắm. Chắn hẳn có các để bạn có thể thoát khỏi đây." }
];

const keyCollectScenes = [
    { img: "https://jobtest.vn/hrblog/wp-content/uploads/2022/08/hoc-phi-dai-hoc-cong-nghe-thong-tin-1.jpg", text: "Mảnh ký ức năm nhất: Thật hoài niệm. Đây là nơi mà bạn tiếp cận một môi trường mới, bạn bè mới. Một cảm giác kì lạ nhưng giờ nó đã là cuộc sống hằng ngày của bạn" },
    { img: "https://dec.ptit.edu.vn/wp-content/uploads/2024/10/nhung-kho-khan-khi-hoc-truc-tuyen-.jpg", text: "Mảnh ký ức năm hai: Lần đầu bạn học vào cơ sở ngành, dù đã tìm hiểu trước nhưng bạn vẫn chưa thật sự thích nghi được với việc làm đồ án." },
    { img: "https://static0.makeuseofimages.com/wordpress/wp-content/uploads/2014/09/stressed-coder.jpg", text: "Mảnh ký ức năm ba: Bạn đã hoàn thành đồ án cá nhân của mình, bạn liền có những suy nghĩ thống trị mảnh IT Việt Nam và rồi bạn rải CV thực tập ." },
    { img: "images/last.gif", text: "Mảnh ký ức năm bốn: Bạn đã bước vào giai đoạn cuối cùng của hành trình học tập tại UIT. Mọi thứ dường như đang chờ đợi bạn...?" }
];
const hiddenItemScenes = [
    {  text: "Năm 2006: Trường Đại học Công nghệ Thông tin (UIT) chính thức được thành lập theo Quyết định số 134/2006/QĐ-TTg ngày 08/06/2006 của Thủ tướng Chính phủ, trở thành trường đại học công lập đầu tiên chuyên đào tạo về CNTT&TT." },
    {  text: "Năm 2007: Tuyển sinh và tổ chức giảng dạy khóa sinh viên đại học chính quy đầu tiên (Khóa 2, do Khóa 1 là sinh viên chuyển tiếp từ Trung tâm Phát triển CNTT) với tư cách là trường đại học thành viên trực thuộc ĐHQG-HCM." },
    { text: "Năm 2008: Tập thể Nhà trường lần đầu tiên vinh dự nhận danh hiệu Tập thể lao động xuất sắc cấp ĐHQG-HCM, khẳng định nỗ lực xây dựng cơ sở vật chất và ổn định hệ thống quản trị nội bộ." },
    {  text: "Năm 2009: Đánh dấu bước tiến lớn trong đào tạo sau đại học khi Giám đốc ĐHQG-HCM chính thức cấp phép cho UIT đào tạo trình độ Tiến sĩ chuyên ngành Khoa học Máy tính." },
    {  text: "Năm 2010: Chính thức ra mắt Hội Sinh viên Việt Nam Trường Đại học Công nghệ Thông tin (28/05/2010), tạo nền tảng cho sự phát triển bùng nổ của các phong trào và CLB sinh viên những năm sau này." },
    {  text: "Năm 2011: Từng bước chuyển toàn bộ hoạt động đào tạo tập trung về cơ sở tại Khu Đô thị ĐHQG-HCM (Linh Xuân, Thủ Đức), mở ra không gian học tập hiện đại, quy mô lớn cho sinh viên." },
    {  text: "Năm 2012: Tiên phong trong công tác đảm bảo chất lượng bằng việc chính thức ban hành quy định lấy ý kiến phản hồi từ sinh viên, đưa sinh viên trở thành chủ thể trung tâm của hoạt động giảng dạy." },
    {  text: "Năm 2013: Sinh viên và nhà nghiên cứu UIT bước đầu tạo tiếng vang quốc tế khi Nhóm nghiên cứu MMLabs xuất sắc đạt Giải Nhất cuộc thi Video Browser Showdown tổ chức tại Trung Quốc." },
    {  text: "Năm 2014: Trường vinh dự được trao tặng Bằng khen của Thủ tướng Chính phủ vì những đóng góp xuất sắc trong sự nghiệp giáo dục, đào tạo nhân lực công nghệ cao cho đất nước." },
    {  text: "Năm 2015: Nhận Bằng khen của Bộ Khoa học và Công nghệ nhờ thành tích dẫn dắt sinh viên đạt giải cao tại cuộc thi An toàn mạng quốc tế, tiếp tục củng cố uy tín về mảng An toàn thông tin." },
  {  text: "Năm 2016: Đội tuyển UIT-Navi làm rạng danh nước nhà khi xuất sắc vô địch cuộc thi An ninh mạng khu vực Đông Nam Á (Cyber SEA Game) tại Indonesia. Ngành Hệ thống thông tin trở thành chương trình đầu tiên của trường đạt chuẩn kiểm định quốc tế AUN-QA." },
  {  text: "Năm 2017: UIT đẩy mạnh hợp tác với các tập đoàn toàn cầu, trở thành đối tác chiến lược cung ứng nguồn nhân lực chất lượng cao, đồng thời dẫn đầu các kỳ thi Olympic Tin học, ICPC toàn quốc." },
  {  text: "Năm 2018: Ngành Truyền thông và Mạng máy tính (nay là Mạng máy tính và Truyền thông dữ liệu) là chương trình tiếp theo đạt chuẩn kiểm định chất lượng AUN-QA danh giá." },
  {  text: "Năm 2019: Chương trình Khoa học Máy tính nối tiếp thành công, vượt qua các đợt đánh giá khắt khe để nhận chứng nhận đạt chuẩn kiểm định AUN-QA." },
  {  text: "Năm 2020: Bất chấp ảnh hưởng của đại dịch, sinh viên UIT lập cú hat-trick ấn tượng với hàng loạt giải thưởng lớn: Giải Nhì, Ba tại ICPC Vietnam Online & ICPC Asia; và giải Ba cuộc thi Olympic Vi điện tử quốc tế (AMO)." },
  {  text: "Năm 2021: Kỷ niệm 15 năm thành lập trường. Đồng thời, chương trình Kỹ thuật Phần mềm chính thức đạt chuẩn kiểm định AUN-QA." },
  {  text: "Năm 2022: Khoa Kỹ thuật Máy tính và ngành An toàn Thông tin tiếp tục đạt kiểm định AUN-QA. Đội tuyển trường giành Giải Nhất cuộc thi Sinh viên với An toàn thông tin ASEAN." },
    {  text: "Năm 2023: UIT thống trị các đấu trường bảo mật khi liên tiếp giành Quán quân cuộc thi Digital Dragons: The Cybersecurity Challenge và ASEAN Cyber Shield 2023." },
      {  text: "Năm 2024: Khẳng định năng lực tư duy toàn diện khi sinh viên UIT xuất sắc mang về 6 huy chương (3 Bạc, 3 Đồng) tại Olympic Toán học sinh viên toàn quốc. Trường có các chương trình đào tạo đạt chứng nhận chất lượng tiêu chuẩn kỹ thuật châu Âu ASIIN." },
        {  text: "Năm 2025 - 2026: Tiếp tục mở rộng các ngành học tương lai như Khoa học Dữ liệu, Trí tuệ Nhân tạo, Thiết kế Vi mạch; đồng thời mở rộng hợp tác quốc tế với các viện nghiên cứu toàn cầu (như FSTI Đức) và duy trì vị thế cái nôi đào tạo chuyên gia IT hàng đầu miền Nam." }
];
const maps = {
    "0,0": [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], 
        [1,0,0,0,0,0,0,5,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,0,0,0,0,0,1,1,1,0,1], 
        [1,0,1,3,1,0,0,1,1,0,0,1,1,1,0,1],
        [1,0,1,0,0,0,0,1,1,0,0,0,5,0,0,1], 
        [4,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
        [4,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0], 
        [1,0,1,4,4,0,0,1,1,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,0,1,1,0,0,1,1,1,0,1], 
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,4,4,0,0,5,0,0,0,0,0,0,0,0,0,1], 
        [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1]
    ],
    "1,0": [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], 
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,0,0,1,1,1,1,1,0,1], 
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,5,1],
        [1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1], 
        [0,0,0,0,1,3,0,0,0,4,4,1,0,0,0,1],
        [0,0,0,0,1,0,0,0,0,5,0,1,0,0,0,1], 
        [1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1],
        [1,0,1,5,0,0,0,0,0,0,0,0,5,1,0,1], 
        [1,0,1,1,1,1,1,1,1,1,1,1,1,1,5,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
     "-1,0": [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], 
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,5,1,1,1,0,0,1,1,1,1,1,0,1], 
        [1,0,1,0,0,0,0,4,4,0,0,0,0,1,5,1],
        [1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1], 
        [1,0,0,0,1,5,0,0,0,0,0,1,4,4,4,4],
        [1,0,0,0,1,0,1,1,1,1,1,1,4,4,4,4], 
        [1,0,1,0,1,0,1,1,1,1,1,1,0,1,0,1],
        [1,5,1,0,1,0,0,4,4,0,0,0,0,1,0,1], 
        [1,0,1,1,1,1,1,1,1,1,1,1,1,1,5,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    "0,1": [
        [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1], 
        [1,0,5,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1], 
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1], 
        [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1],
        [0,0,0,0,1,5,0,0,0,0,0,1,0,0,0,1], 
        [1,0,1,0,1,1,1,1,1,4,4,1,0,4,0,1],
        [1,0,0,5,0,0,0,0,0,0,0,0,0,4,0,1], 
        [1,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1], 
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    "-1,1": [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], 
        [1,0,0,0,5,0,0,4,4,0,0,0,5,0,0,1],
        [1,0,1,1,1,1,1,1,0,0,1,1,1,1,0,1], 
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1], 
        [1,0,3,0,1,0,0,0,0,0,0,1,0,0,0,0],
        [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0], 
        [1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1], 
        [1,5,1,1,1,1,1,1,1,0,0,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,4,0,0,0,0,0,0,1], 
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
};

function getMap(rX, rY) {
    return maps[`${rX},${rY}`] || maps["0,0"];
}

const bossEndingDialogues = [
    {
        text: "* ...",
        pause: 1200
    },
    {
        text: "* Ngươi... .",
        pause: 0
    },
    {
        text: "* ...",
        pause: 0
    },
    {
        text: "* ... Có lẽ",
        pause: 0
    },
    {
        text: "* Thôi không có gì đâu.",
        pause: 1500
    },
    {
        text: "* Ta .",
        pause: 0
    },
    {
        text: "* Ta là nơi ngươi đã trưởng thành.",
        pause: 0
    },
    {
        text: "* Mang theo những ký ức đó đi. Chúng là của ngươi.",
        pause: 0
    },
    {
        text: "* Và đừng quên... nơi này sẽ luôn là một phần của ngươi.",
        pause: 2000
    },
    {
        text: "* Chúc mừng tốt nghiệp, sinh viên của ta.",
        pause: 0
    }
];