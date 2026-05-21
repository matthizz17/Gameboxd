import { collection, addDoc, serverTimestamp, getDocs, limit, query } from 'firebase/firestore';
import { db } from './firebase';

const MOCK_REVIEWS = [
  {
    gameTitle: "Elden Ring",
    gameCoverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/library_600x900_2x.jpg",
    userDisplayName: "Tarnished_One",
    rating: 5,
    content: "O melhor mundo aberto que já joguei. A sensação de descoberta é inigualável e os chefes são épicos. Morri 100 vezes para a Malenia mas valeu a pena.",
    pcSpecs: { cpu: "Ryzen 7 5800X", gpu: "RTX 3080", ram: "32GB" },
    likesCount: 124,
    userId: "seed_1"
  },
  {
    gameTitle: "God of War Ragnarök",
    gameCoverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/2322010/library_600x900_2x.jpg",
    userDisplayName: "Boy_Enjoyer",
    rating: 5,
    content: "Uma jornada emocional incrível. O combate é fluido e a história de pai e filho atinge o auge aqui. Visualmente deslumbrante.",
    pcSpecs: { cpu: "i5-12400F", gpu: "RTX 3060", ram: "16GB" },
    likesCount: 85,
    userId: "seed_2"
  },
  {
    gameTitle: "Cyberpunk 2077",
    gameCoverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/library_600x900_2x.jpg",
    userDisplayName: "V_NightCity",
    rating: 4,
    content: "Depois de todos os patches, o jogo está fenomenal. A ambientação de Night City é a coisa mais linda que já vi em um RPG. A trilha sonora é 10/10.",
    pcSpecs: { cpu: "i9-13900K", gpu: "RTX 4090", ram: "64GB" },
    likesCount: 42,
    userId: "seed_3"
  },
  {
    gameTitle: "The Last of Us Part I",
    gameCoverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1888140/library_600x900_2x.jpg",
    userDisplayName: "Joel_F",
    rating: 5,
    content: "Ainda é o melhor jogo de história já feito. O remake trouxe gráficos que fazem justiça à narrativa pesada.",
    pcSpecs: { cpu: "Ryzen 5 3600", gpu: "RTX 2060", ram: "16GB" },
    likesCount: 56,
    userId: "seed_4"
  },
  {
    gameTitle: "Red Dead Redemption 2",
    gameCoverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1174180/library_600x900_2x.jpg",
    userDisplayName: "Arthur_Morgan",
    rating: 5,
    content: "Não é apenas um jogo, é uma simulação de vida. A atenção aos detalhes é doentia. Chorei no final.",
    pcSpecs: { cpu: "i7-10700K", gpu: "RTX 3070", ram: "32GB" },
    likesCount: 210,
    userId: "seed_5"
  },
  {
    gameTitle: "Hades",
    gameCoverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1145360/library_600x900_2x.jpg",
    userDisplayName: "Zagreus_Prince",
    rating: 5,
    content: "Viciante e recompensador. Um dos melhores rogue-likes de todos os tempos.",
    pcSpecs: { cpu: "Ryzen 5 5600", gpu: "GTX 1650", ram: "16GB" },
    likesCount: 45,
    userId: "seed_9"
  }
];

export async function seedInitialData() {
  const reviewsRef = collection(db, 'reviews');
  const q = query(reviewsRef, limit(1));
  const snap = await getDocs(q);

  if (snap.empty) {
    console.log("Seeding initial reviews...");
    for (const review of MOCK_REVIEWS) {
      await addDoc(reviewsRef, {
        ...review,
        gameId: encodeURIComponent(review.gameTitle),
        createdAt: serverTimestamp(),
        userPhotoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`
      });
    }
  }
}
