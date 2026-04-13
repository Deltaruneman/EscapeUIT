const TILE_SIZE = 50;
const COLS = 16, ROWS = 12;

const storyScenes = [
    { img: "https://www.uit.edu.vn/_next/image?url=https%3A%2F%2Fwww.uit.edu.vn%2Fstrapi%2Fuploads%2FUIT_1_e406b7e283.jpg&w=1536&q=75", text: "Bạn là 1 sinh viên bình thường ở UIT." },
    { img: "https://banqlcs.uit.edu.vn/sites/banqlcs/files/styles/slider/public/slider/uit_dsc_0001_web.jpg?itok=F6x8u5Oi", text: "Hôm nay là 1 ngày bình thường, ngày mai chính là lễ tốt nghiệp." },
    { img: "https://dep.com.vn/wp-content/uploads/2023/07/4-14.png", text: "Nhưng dường như có gì đó đang bám theo bạn ngay từ cổng trường... MAU CHẠY ĐI!" }
];

const keyCollectScenes = [
    { img: "https://jobtest.vn/hrblog/wp-content/uploads/2022/08/hoc-phi-dai-hoc-cong-nghe-thong-tin-1.jpg", text: "Năm 1: Mọi thứ thật tươi đẹp, nhưng áp lực bắt đầu xuất hiện." },
    { img: "https://dec.ptit.edu.vn/wp-content/uploads/2024/10/nhung-kho-khan-khi-hoc-truc-tuyen-.jpg", text: "Năm 2: Deadline bủa vây, 'NÓ' đang ở rất gần bạn." },
    { img: "https://static0.makeuseofimages.com/wordpress/wp-content/uploads/2014/09/stressed-coder.jpg", text: "Năm 3: Bạn đã kiệt sức, ngọn lửa nhiệt huyết của bạn đang dần vụt tắt. 'Nó' đã và đang khiến mọi thứ trở nên khó khăn hơn." },
    { img: "https://scontent.fsgn2-6.fna.fbcdn.net/v/t39.30808-6/567184589_1290914559741212_5950352786700967026_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeHZ3yqPb3JvuH-03xldEEVz3TVpuxcJdMbdNWm7Fwl0xsTW9yyYbL3KozsXzChIpaprtNZ_q-cBRBI1XTwG3pAN&_nc_ohc=QH_2JoGvvRAQ7kNvwHY1LBB&_nc_oc=AdouaVlMVeV2PzSg-Ayq0QwlVjR4cFM86nebxQR-yOqjfmCzeg_r5ejVleAXjPJY4UrO27cGHmmYTXYZa2Vb1z3j&_nc_zt=23&_nc_ht=scontent.fsgn2-6.fna&_nc_gid=JhpkC_tpqy7VFcQREofu5w&_nc_ss=7a3a8&oh=00_Af0kdN7kfBnUQaABGpwSnG3rGxUnt8oVpxQA3Tg8TyViRA&oe=69E18E4D", text: "Năm thứ 4, đã năm thứ 4 rồi. Mày định bỏ cuộc ư. Thức dậy ngay đi!!" }
];

const endingScenes = [
    { img: "https://example.com/ending1.jpg", text: "Bạn đã vượt qua tất cả thử thách và tốt nghiệp thành công!" },
    { img: "https://example.com/ending2.jpg", text: "Bạn đã thất bại, nhưng bài học này sẽ giúp bạn trưởng thành hơn." },
    { img: "https://example.com/ending3.jpg", text: "Một kết thúc mở, tương lai của bạn vẫn đang chờ đợi." }
];

const maps = {
    "0,0": [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,0,0,0,0,0,1,1,1,0,1], [1,0,1,3,1,0,0,1,1,0,0,1,0,1,0,1],
        [1,0,1,0,0,0,0,1,1,0,0,0,0,1,0,1], [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], [1,0,1,0,0,0,0,1,1,0,0,0,0,1,0,1],
        [1,0,1,1,1,0,0,1,1,0,0,1,1,1,0,1], [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1]
    ],
    "1,0": [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,0,0,1,1,1,1,1,0,1], [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1], [0,0,0,0,1,3,0,0,0,0,0,1,0,0,0,1],
        [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1], [1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1], [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    "0,1": [
        [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1], [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1], [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1], [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1],
        [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1], [1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1], [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1], [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    "-1,1": [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1], [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1], [1,0,3,0,1,0,0,0,0,0,0,1,0,0,0,0],
        [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0], [1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1], [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
};

function getMap(rX, rY) {
    return maps[`${rX},${rY}`] || maps["0,0"];
}