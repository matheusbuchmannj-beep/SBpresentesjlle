import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './lib/firebase';

const initialProducts = [
  {
    name: "Quadro Personalizado A4",
    descriptionShort: "Elegante e impactante, perfeito para a sala ou quarto.",
    descriptionFull: "Nosso quadro A4 (21x30cm) é produzido com materiais de alta qualidade e acabamento premium. Acompanha moldura e vidro protetor. Ideal para eternizar aquela foto especial com sua mãe.",
    price: 90.00,
    imageUrl: "https://picsum.photos/seed/quadroA4/800/800",
    active: true,
    featured: true,
    order: 1,
    category: "Quadros"
  },
  {
    name: "Quadro Personalizado 10x15",
    descriptionShort: "Delicado e versátil, ideal para mesas e estantes.",
    descriptionFull: "O clássico tamanho 10x15cm em uma versão premium. Compacto, mas cheio de significado. Perfeito para presentear e decorar pequenos espaços com grandes memórias.",
    price: 50.00,
    imageUrl: "https://picsum.photos/seed/quadro10x15/800/800",
    active: true,
    featured: true,
    order: 2,
    category: "Quadros"
  }
];

export async function seedDatabase() {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('active', '==', true));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log("Seeding initial products...");
    for (const product of initialProducts) {
      await addDoc(productsRef, product);
    }
    console.log("Seeding complete.");
  }
}
