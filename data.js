const TILE_SIZE = 50;
const COLS = 16, ROWS = 12;

const storyScenes = [
    { img: "https://www.uit.edu.vn/_next/image?url=https%3A%2F%2Fwww.uit.edu.vn%2Fstrapi%2Fuploads%2FUIT_1_e406b7e283.jpg&w=1536&q=75", text: "Bạn là 1 sinh viên bình thường ở UIT." },
    { img: "https://banqlcs.uit.edu.vn/sites/banqlcs/files/styles/slider/public/slider/uit_dsc_0001_web.jpg?itok=F6x8u5Oi", text: "Trừ việc ngày mai là lễ tốt nghiệp thì tối nay là 1 ngày bình thường." },
    { img: "https://dep.com.vn/wp-content/uploads/2023/07/4-14.png", text: "Yeh.. vì lí do gì đó mà bạn lại ở đây vào 12 giờ dêm tại UIT. có lẽ và vì hồi hợp chăn?" },
    { text: "Well, có lẽ khá bình thường nếu bạn hỏi tôi ngoại trừ có 1 thứ gì đó đang theo đuổi bạn... Chờ đã cái gì cơ?!?!" }
];

const keyCollectScenes = [
    { img: "https://jobtest.vn/hrblog/wp-content/uploads/2022/08/hoc-phi-dai-hoc-cong-nghe-thong-tin-1.jpg", text: "Mảnh ký ức năm nhất: Thật hoài niệm. Đây là nơi mà bạn tiếp cận một môi trường mới, bạn bè mới. Một cảm giác kì lạ nhưng giờ nó đã là cuộc sống hằng ngày của bạn" },
    { img: "https://dec.ptit.edu.vn/wp-content/uploads/2024/10/nhung-kho-khan-khi-hoc-truc-tuyen-.jpg", text: "Mảnh ký ức năm hai: Lần đầu bạn học vào cơ sở ngành, dù đã tìm hiểu trước nhưng bạn vẫn chưa thật sự thích nghi được với việc làm đồ án." },
    { img: "https://static0.makeuseofimages.com/wordpress/wp-content/uploads/2014/09/stressed-coder.jpg", text: "Mảnh ký ức năm ba: Bạn đã hoàn thành đồ án cá nhân của mình, bạn liền có những suy nghĩ thống trị mảnh IT Việt Nam và rồi bạn rải CV thực tập ." },
    { img: "https://scontent.fsgn2-6.fna.fbcdn.net/v/t39.30808-6/567184589_1290914559741212_5950352786700967026_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeHZ3yqPb3JvuH-03xldEEVz3TVpuxcJdMbdNWm7Fwl0xsTW9yyYbL3KozsXzChIpaprtNZ_q-cBRBI1XTwG3pAN&_nc_ohc=QH_2JoGvvRAQ7kNvwHY1LBB&_nc_oc=AdouaVlMVeV2PzSg-Ayq0QwlVjR4cFM86nebxQR-yOqjfmCzeg_r5ejVleAXjPJY4UrO27cGHmmYTXYZa2Vb1z3j&_nc_zt=23&_nc_ht=scontent.fsgn2-6.fna&_nc_gid=JhpkC_tpqy7VFcQREofu5w&_nc_ss=7a3a8&oh=00_Af0kdN7kfBnUQaABGpwSnG3rGxUnt8oVpxQA3Tg8TyViRA&oe=69E18E4D", text: "Mảnh ký ức năm bốn: Bạn đã bước vào giai đoạn cuối cùng của hành trình học tập tại UIT. Mọi thứ dường như đang chờ đợi bạn...?" }
];
const hiddenItemScenes = [
    {  text: "UIT là nơi bạn đặt chân nhiều nhất trong 4 năm đại học này." },
    {  text: "Một lần nữa dạo bước trên con đường thân thuộc mà lạ lẫm." },
    { text: "Băng ghế UIT nơi mà bạn ăn vội bán mì mua từ cantin cho kịp giờ học." },
    {  text: "Máy lọc nước UIT, nơi mà bạn... lấy nước về trọ??" },
    {  text: "Tòa A UIT, nơi đầu tiên mà bạn đến và nghe buổi sinh hoạt công dân đầu khóa." },
    {  text: "Tòa B UIT, nơi mà bạn đến học nhiều nhất, đa số các môn học đều được giảng dạy ở đây." },
    {  text: "Tòa C UIT, tòa nhà mới này được trang bị công nghệ hiện đại, cảm giác như bạn vừa từ đến 2077 vậy." },
    {  text: "Tòa D UIT, nhà ăn này từng là điểm bạn đến ăn nhiều nhất.. cho đến khi nó tăng giá, dĩ nhiên." },
    {  text: "Tòa E UIT, nơi mà các phòng ban của các khoa hoạt động. bạn đã từng đến đây vài lần vì số môn dậy ở đây khá ít." },
    {  text: "Sân bóng UIT, nơi mà bạn có thể chạm cỏ ở trường và số lần bạn đến đây gần như không đến." }
  
];
const maps = {
    "0,0": [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], 
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,0,0,0,0,0,1,1,1,0,1], 
        [1,0,1,3,1,0,0,1,1,0,0,1,1,1,0,1],
        [1,0,1,0,0,0,0,1,1,0,0,0,0,1,0,1], 
        [4,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
        [4,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0], 
        [1,0,1,0,0,0,0,1,1,0,0,0,0,1,0,1],
        [1,0,1,1,1,0,0,1,1,0,0,1,1,1,0,1], 
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
        [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1]
    ],
    "1,0": [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], 
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,0,0,1,1,1,1,1,0,1], 
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,5,1],
        [1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1], 
        [0,0,0,0,1,3,0,0,0,0,0,1,0,0,0,1],
        [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1], 
        [1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,5,1,0,1], 
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
        [1,5,1,0,1,0,0,4,4,0,0,0,5,1,0,1], 
        [1,0,1,1,1,1,1,1,1,1,1,1,1,1,5,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    "0,1": [
        [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1], 
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1], 
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1], 
        [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1],
        [0,0,0,0,1,5,0,0,0,0,0,1,0,0,0,1], 
        [1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1], 
        [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1], 
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    "-1,1": [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], 
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1], 
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1], 
        [1,0,3,0,1,0,0,0,0,0,0,1,0,0,0,0],
        [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0], 
        [1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1], 
        [1,5,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], 
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
    // ← Thêm lời thoại mới vào đây theo cùng định dạng
];