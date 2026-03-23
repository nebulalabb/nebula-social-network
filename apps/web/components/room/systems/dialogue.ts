import type { DialogueTree } from "../ui/DialogueBox";

export const introDialogue: DialogueTree = {
  start: "d1",
  nodes: {
    d1: {
      id: "d1",
      speaker: "Hana — Hướng dẫn viên",
      speakerIcon: "🌸",
      text: "Chào mừng bạn đến với thế giới Anime Social! Đây là căn phòng riêng của bạn ✨",
      next: "d2",
    },
    d2: {
      id: "d2",
      speaker: "Hana — Hướng dẫn viên",
      speakerIcon: "🌸",
      text: "Bạn có thể di chuyển bằng WASD, nhảy bằng Space, và đổi góc nhìn bằng V.",
      next: "d3",
    },
    d3: {
      id: "d3",
      speaker: "Hana — Hướng dẫn viên",
      speakerIcon: "🌸",
      text: "Hãy thử click vào các món đồ trong phòng để xem thông tin chi tiết nhé! 🪑",
      next: "d4",
    },
    d4: {
      id: "d4",
      speaker: "Hana — Hướng dẫn viên",
      speakerIcon: "🌸",
      text: "Nếu bạn là chủ phòng, nhấn nút ✏️ để trang trí và kéo thả đồ vật theo ý thích.",
      next: "d5",
    },
    d5: {
      id: "d5",
      speaker: "Hệ thống",
      speakerIcon: "⚙️",
      text: "Chúc bạn vui vẻ! Hãy mời bạn bè vào phòng và cùng nhau khám phá thế giới anime 🎌",
    },
  },
};
