import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, OperationType, handleFirestoreError } from './lib/firebase';
import { cn, formatPrice, WHATSAPP_NUMBER, isDeadlinePassed } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Instagram, 
  MessageCircle, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Truck, 
  Camera,
  Menu,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';

// --- Types ---
interface Product {
  id: string;
  name: string;
  descriptionShort: string;
  descriptionFull: string;
  style: string;
  price: number;
  imageUrl: string;
  images: string[];
  active: boolean;
  featured: boolean;
  order: number;
  category: string;
}

interface Variation {
  name: string;
  price: number;
}

interface Settings {
  id: string;
  storeName: string;
  whatsappNumber: string;
  instagram: string;
  bannerUrl: string;
  logoUrl?: string;
  shippingInfo: string;
  joinvilleOnlyInfo: string;
  photoInfo: string;
  deadlineInfo: string;
  paymentLinkInfo: string;
  categories: string[];
  variations: Variation[];
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  imageUrl: string;
}

interface Order {
  customerName: string;
  customerPhone: string;
  bairro?: string;
  address?: string;
  complement?: string;
  recipientName?: string;
  occasion?: string;
  items: CartItem[];
  observations?: string;
  deliveryDate?: string;
  deliveryPeriod: 'manhã' | 'tarde' | 'noite';
  deliveryType: 'entrega' | 'retirada';
  paymentMethod: 'Pix' | 'Link de pagamento';
  status: string;
  createdAt: any;
  total: number;
}

// --- Components ---

const Navbar = ({ onAdminClick, cartCount, onCartClick }: { onAdminClick: () => void, cartCount: number, onCartClick: () => void }) => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.data());
    });
    return unsub;
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-premium-beige">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {settings?.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
          )}
          <span className="text-xl font-serif font-bold tracking-tight text-premium-brown">{settings?.storeName || 'SB PRESENTES'}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={onAdminClick} className="text-[10px] sm:text-xs uppercase tracking-widest text-premium-warm-brown font-medium">Admin</button>
          
          <button 
            onClick={onCartClick}
            className="relative p-2 text-premium-brown hover:text-premium-terracotta transition-colors"
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-premium-terracotta text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          <a 
            href={`https://wa.me/${settings?.whatsappNumber || WHATSAPP_NUMBER}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 bg-premium-terracotta/10 rounded-full text-premium-terracotta"
          >
            <MessageCircle size={20} />
          </a>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ onScrollToProducts }: { onScrollToProducts: () => void }) => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.data());
    });
    return unsub;
  }, []);

  return (
    <section className="relative pt-24 pb-12 px-4 overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-premium-terracotta/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-premium-beige/30 rounded-full blur-3xl" />
      
      <div className="max-w-4xl mx-auto">
        {settings?.bannerUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 rounded-3xl overflow-hidden shadow-2xl border border-premium-beige w-full bg-premium-beige/5"
            style={{ aspectRatio: '1920 / 650' }}
          >
            <img 
              src={settings.bannerUrl} 
              alt="Banner" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}

        <div className="text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-premium-terracotta/10 text-premium-terracotta text-xs font-semibold uppercase tracking-widest">
              Especial Dia das Mães
            </span>
            <h1 className="text-4xl md:text-5xl font-serif text-premium-brown leading-tight mb-6">
              Eternize o amor com um <span className="italic">presente afetivo</span>
            </h1>
            <p className="text-lg text-premium-warm-brown mb-10 leading-relaxed">
              Quadros personalizados com suas fotos favoritas. Pronto para presentear quem você mais ama.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onScrollToProducts}
                className="w-full sm:w-auto premium-button-primary flex items-center justify-center gap-2"
              >
                Ver produtos <ChevronRight size={18} />
              </button>
              <a 
                href={`https://wa.me/${settings?.whatsappNumber || WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto premium-button-secondary flex items-center justify-center gap-2"
              >
                Pedir pelo WhatsApp
              </a>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-premium-warm-brown">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-premium-terracotta" />
                <span>{settings?.deadlineInfo || 'Pedidos até 08/05'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-premium-terracotta" />
                <span>{settings?.joinvilleOnlyInfo || 'Apenas Joinville/SC'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ProductCard = ({ product, onSelect, variations }: { product: Product; onSelect: (p: Product) => void; variations: Variation[] }) => {
  const displayPrice = variations.length > 0 
    ? Math.min(...variations.map(v => v.price)) 
    : product.price;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="premium-card flex flex-col h-full group"
    >
      <div className="aspect-square overflow-hidden relative">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        {isDeadlinePassed() && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 text-center z-10">
            <span className="text-white font-medium text-sm">Pedidos encerrados</span>
          </div>
        )}
        {product.featured && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-premium-terracotta shadow-sm z-10">
            Destaque
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-premium-terracotta/70">
            {product.style || 'Personalizado'}
          </span>
        </div>
        <h3 className="text-xl font-serif text-premium-brown mb-2">{product.name}</h3>
        <p className="text-sm text-premium-warm-brown mb-4 flex-grow">{product.descriptionShort}</p>
        <div className="flex items-center justify-between mt-auto gap-2">
          <div>
            <span className="block text-[10px] text-premium-warm-brown uppercase tracking-wider">A partir de</span>
            <span className="text-lg font-serif font-bold text-premium-brown">{formatPrice(displayPrice)}</span>
          </div>
          <button 
            onClick={() => onSelect(product)}
            disabled={isDeadlinePassed()}
            className="premium-button-secondary py-2 px-4 text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ver detalhes <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ProductModal = ({ product, onClose, onAddToCart, variations }: { product: Product; onClose: () => void; onAddToCart: (p: Product, size: string, price: number) => void; variations: Variation[] }) => {
  const [selectedSize, setSelectedSize] = useState<Variation | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const allImages = [product.imageUrl, ...(product.images || [])];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const currentPrice = selectedSize ? selectedSize.price : product.price;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-4xl sm:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-screen sm:max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Gallery Section */}
        <div className="relative w-full md:w-1/2 bg-premium-beige/20 aspect-square md:aspect-auto">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentImageIndex}
              src={allImages[currentImageIndex]} 
              alt={product.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          
          {allImages.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-premium-brown shadow-md hover:bg-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-premium-brown shadow-md hover:bg-white transition-colors"
              >
                <ChevronRight size={20} />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      idx === currentImageIndex ? "bg-premium-terracotta w-4" : "bg-premium-terracotta/30"
                    )}
                  />
                ))}
              </div>
            </>
          )}
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-premium-brown shadow-md hover:bg-white transition-colors md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Section */}
        <div className="w-full md:w-1/2 p-6 md:p-12 overflow-y-auto flex flex-col">
          <div className="hidden md:flex justify-end mb-4">
            <button onClick={onClose} className="text-premium-warm-brown hover:text-premium-brown transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="mb-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-premium-terracotta">
              {product.style || 'Personalizado'}
            </span>
          </div>
          
          <h2 className="text-3xl font-serif text-premium-brown mb-4">{product.name}</h2>
          
          <div className="prose prose-sm text-premium-warm-brown mb-8">
            <p className="whitespace-pre-wrap leading-relaxed">{product.descriptionFull || product.descriptionShort}</p>
          </div>

          <div className="space-y-6 mt-auto">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-premium-warm-brown mb-3">
                Escolha o Tamanho <span className="text-premium-terracotta">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3">
                {variations.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => setSelectedSize(v)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 text-left",
                      selectedSize?.name === v.name 
                        ? "border-premium-terracotta bg-premium-terracotta/5 text-premium-brown" 
                        : "border-premium-beige hover:border-premium-warm-brown text-premium-warm-brown"
                    )}
                  >
                    <span className="font-medium">{v.name}</span>
                    <span className="font-serif font-bold">{formatPrice(v.price)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-premium-beige">
              <div className="flex items-center justify-between mb-6">
                <span className="text-premium-warm-brown">Preço Total</span>
                <span className="text-3xl font-serif font-bold text-premium-brown">
                  {formatPrice(currentPrice)}
                </span>
              </div>

              <button 
                onClick={() => selectedSize && onAddToCart(product, selectedSize.name, selectedSize.price)}
                disabled={!selectedSize || isDeadlinePassed()}
                className="w-full premium-button-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
              >
                <ShoppingBag size={22} />
                {selectedSize ? 'Adicionar ao Carrinho' : 'Selecione o Tamanho'}
              </button>
              
              <div className="flex items-start gap-3 p-3 bg-premium-beige/30 rounded-xl mt-4">
                <Camera size={18} className="text-premium-terracotta mt-0.5" />
                <p className="text-[10px] text-premium-warm-brown italic">
                  Após finalizar o pedido, envie a foto pelo WhatsApp (pode enviar várias)
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CartView = ({ 
  cart, 
  onClose, 
  onRemove, 
  onUpdateQuantity, 
  onCheckout 
}: { 
  cart: CartItem[]; 
  onClose: () => void; 
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, q: number) => void;
  onCheckout: () => void;
}) => {
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex justify-end bg-black/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-premium-beige flex items-center justify-between">
          <h2 className="text-2xl font-serif text-premium-brown">Seu Carrinho</h2>
          <button onClick={onClose} className="p-2 hover:bg-premium-beige rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <ShoppingBag size={64} className="text-premium-beige" />
              <p className="text-premium-warm-brown">Seu carrinho está vazio.</p>
              <button onClick={onClose} className="premium-button-secondary">Voltar a Comprar</button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4 p-4 bg-premium-offwhite rounded-2xl border border-premium-beige">
                <img src={item.imageUrl} className="w-20 h-20 object-cover rounded-xl" referrerPolicy="no-referrer" />
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif text-premium-brown">{item.name}</h3>
                    <button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-600">
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-premium-warm-brown mb-2">Tamanho: {item.size}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 bg-white rounded-lg border border-premium-beige px-2 py-1">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="text-premium-terracotta font-bold px-1"
                      >-</button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="text-premium-terracotta font-bold px-1"
                      >+</button>
                    </div>
                    <span className="font-bold text-premium-terracotta">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-premium-beige bg-premium-offwhite space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-serif text-premium-brown">Total</span>
              <span className="font-bold text-premium-terracotta">{formatPrice(total)}</span>
            </div>
            <button 
              onClick={onCheckout}
              className="w-full premium-button-primary py-4"
            >
              Finalizar Pedido
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const OrderForm = ({ items, onBack, onSubmit }: { items: CartItem[]; onBack: () => void; onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    bairro: '',
    address: '',
    complement: '',
    recipientName: '',
    occasion: 'Dia das Mães',
    observations: '',
    deliveryDate: '',
    deliveryPeriod: 'manhã',
    deliveryType: 'entrega',
    paymentMethod: 'Pix',
  });

  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isFormValid = formData.customerName && formData.customerPhone;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button onClick={onBack} className="flex items-center gap-2 text-premium-warm-brown mb-8 hover:text-premium-terracotta transition-colors">
        <ChevronLeft size={20} /> Voltar
      </button>
      
      <h2 className="text-3xl font-serif text-premium-brown mb-2">Finalizar Pedido</h2>
      <p className="text-premium-warm-brown mb-10">Preencha os dados abaixo para concluir sua compra de {items.length} item(ns).</p>
      
      <div className="mb-10 p-6 bg-white rounded-3xl border border-premium-beige">
        <h3 className="text-lg font-serif text-premium-brown mb-4">Resumo do Pedido</h3>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-premium-brown">{item.name} ({item.size}) x{item.quantity}</span>
              <span className="font-bold text-premium-terracotta">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="pt-3 border-t border-premium-beige flex justify-between font-bold text-lg">
            <span className="text-premium-brown">Total</span>
            <span className="text-premium-terracotta">{formatPrice(total)}</span>
          </div>
        </div>
      </div>
      
      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); if(isFormValid) onSubmit(formData); }}>
        <div className="space-y-6">
          <h3 className="text-lg font-serif text-premium-brown border-b border-premium-beige pb-2">Seus Dados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-premium-warm-brown">Nome Completo *</label>
              <input required name="customerName" value={formData.customerName} onChange={handleChange} className="premium-input" placeholder="Como podemos te chamar?" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-premium-warm-brown">WhatsApp *</label>
              <input required name="customerPhone" value={formData.customerPhone} onChange={handleChange} className="premium-input" placeholder="(47) 99999-9999" />
            </div>
          </div>
          <p className="text-xs text-premium-warm-brown italic">
            * Prazo de produção e entrega: 2 dias úteis após a confirmação.
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-serif text-premium-brown border-b border-premium-beige pb-2">Forma de Recebimento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-premium-warm-brown">Como deseja receber?</label>
              <select name="deliveryType" value={formData.deliveryType} onChange={handleChange} className="premium-input">
                <option value="entrega">Entrega (Joinville)</option>
                <option value="retirada">Retirada (Aventureiro)</option>
              </select>
            </div>
            {formData.deliveryType === 'retirada' && (
              <div className="flex items-center p-4 bg-premium-beige/10 rounded-xl border border-dashed border-premium-beige">
                <p className="text-sm text-premium-brown">
                  <MapPin size={16} className="inline mr-2 text-premium-terracotta" />
                  A retirada é realizada no bairro <strong>Aventureiro</strong>. O endereço completo será enviado via WhatsApp.
                </p>
              </div>
            )}
          </div>
        </div>

        {formData.deliveryType === 'entrega' && (
          <div className="space-y-6">
            <h3 className="text-lg font-serif text-premium-brown border-b border-premium-beige pb-2">Endereço de Entrega (Joinville)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-premium-warm-brown">Bairro</label>
                <input name="bairro" value={formData.bairro} onChange={handleChange} className="premium-input" placeholder="Ex: Centro" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-premium-warm-brown">Endereço Completo</label>
                <input name="address" value={formData.address} onChange={handleChange} className="premium-input" placeholder="Rua, número" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-premium-warm-brown">Complemento / Referência</label>
                <input name="complement" value={formData.complement} onChange={handleChange} className="premium-input" placeholder="Apto, bloco, próximo a..." />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-lg font-serif text-premium-brown border-b border-premium-beige pb-2">Detalhes do Presente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-premium-warm-brown">Nome da Pessoa Presenteada</label>
              <input name="recipientName" value={formData.recipientName} onChange={handleChange} className="premium-input" placeholder="Quem vai receber?" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-premium-warm-brown">Ocasião</label>
              <input name="occasion" value={formData.occasion} onChange={handleChange} className="premium-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-premium-warm-brown">Data Desejada</label>
              <input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} className="premium-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-premium-warm-brown">Período Desejado</label>
              <select name="deliveryPeriod" value={formData.deliveryPeriod} onChange={handleChange} className="premium-input">
                <option value="manhã">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-premium-warm-brown">Forma de Pagamento</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="premium-input">
                <option value="Pix">Pix</option>
                <option value="Link de pagamento">Link de pagamento</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-premium-warm-brown">Observações do Pedido</label>
            <textarea name="observations" value={formData.observations} onChange={handleChange} className="premium-input min-h-[100px]" placeholder="Algum detalhe especial?" />
          </div>
        </div>

        <button 
          type="submit"
          disabled={!isFormValid}
          className="w-full premium-button-primary py-4 text-lg shadow-lg shadow-premium-terracotta/20"
        >
          Revisar Pedido
        </button>
      </form>
    </div>
  );
};

const OrderSummary = ({ items, orderData, onBack, onConfirm }: { items: CartItem[]; orderData: any; onBack: () => void; onConfirm: () => void }) => {
  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button onClick={onBack} className="flex items-center gap-2 text-premium-warm-brown mb-8 hover:text-premium-terracotta transition-colors">
        <ChevronLeft size={20} /> Voltar e editar
      </button>

      <div className="premium-card p-8 space-y-8">
        <div className="text-center">
          <CheckCircle2 size={48} className="text-premium-terracotta mx-auto mb-4" />
          <h2 className="text-3xl font-serif text-premium-brown">Resumo do Pedido</h2>
          <p className="text-premium-warm-brown">Confira se está tudo certinho antes de enviar.</p>
        </div>

        <div className="space-y-6">
          <div className="border-b border-premium-beige pb-4">
            <p className="text-sm text-premium-warm-brown uppercase tracking-wider mb-4">Itens do Pedido</p>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-premium-brown">{item.name} ({item.size})</p>
                    <p className="text-xs text-premium-warm-brown">Quantidade: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-premium-terracotta">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-premium-beige font-bold text-lg">
              <span className="text-premium-brown">Total</span>
              <span className="text-premium-terracotta">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-premium-warm-brown uppercase tracking-wider mb-1">Cliente</p>
              <p className="text-premium-brown font-medium">{orderData.customerName}</p>
              <p className="text-sm text-premium-warm-brown">{orderData.customerPhone}</p>
            </div>
            <div>
              <p className="text-xs text-premium-warm-brown uppercase tracking-wider mb-1">Presenteado(a)</p>
              <p className="text-premium-brown font-medium">{orderData.recipientName || 'Não informado'}</p>
              <p className="text-sm text-premium-warm-brown">{orderData.occasion || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-xs text-premium-warm-brown uppercase tracking-wider mb-1">Recebimento</p>
              <p className="text-premium-brown font-medium capitalize">{orderData.deliveryType}</p>
              <p className="text-sm text-premium-warm-brown">
                {orderData.deliveryDate || 'Data a combinar'} - {orderData.deliveryPeriod}
              </p>
            </div>
            {orderData.deliveryType === 'entrega' ? (
              <div>
                <p className="text-xs text-premium-warm-brown uppercase tracking-wider mb-1">Endereço</p>
                <p className="text-premium-brown font-medium">{orderData.bairro || 'Não informado'}</p>
                <p className="text-sm text-premium-warm-brown">{orderData.address || 'Não informado'}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-premium-warm-brown uppercase tracking-wider mb-1">Local de Retirada</p>
                <p className="text-premium-brown font-medium">Bairro Aventureiro</p>
                <p className="text-sm text-premium-warm-brown italic">Endereço completo via WhatsApp</p>
              </div>
            )}
          </div>

          {orderData.observations && (
            <div>
              <p className="text-xs text-premium-warm-brown uppercase tracking-wider mb-1">Observações</p>
              <p className="text-sm text-premium-brown italic">"{orderData.observations}"</p>
            </div>
          )}

          <div className="bg-premium-beige/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs text-premium-warm-brown">
              <AlertCircle size={14} /> <span>Frete e agendamento serão confirmados no WhatsApp.</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-premium-warm-brown">
              <AlertCircle size={14} /> <span>Envie as fotos para personalização após confirmar.</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onConfirm}
          className="w-full premium-button-primary py-4 text-lg flex items-center justify-center gap-3"
        >
          Confirmar e Abrir WhatsApp <MessageCircle size={22} />
        </button>
      </div>
    </div>
  );
};

const SuccessScreen = () => (
  <div className="max-w-2xl mx-auto px-4 py-20 text-center">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="premium-card p-10"
    >
      <div className="w-20 h-20 bg-premium-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <MessageCircle size={40} className="text-premium-terracotta" />
      </div>
      <h2 className="text-3xl font-serif text-premium-brown mb-4">Pedido Encaminhado!</h2>
      <p className="text-lg text-premium-warm-brown mb-8">
        Agora você deve enviar a mensagem no WhatsApp e, em seguida, **enviar a foto** que será usada na personalização do quadro.
      </p>
      <div className="space-y-4">
        <p className="text-sm font-medium text-premium-terracotta uppercase tracking-widest">Próximos Passos:</p>
        <ul className="text-left space-y-3 max-w-xs mx-auto">
          <li className="flex items-center gap-3 text-premium-brown">
            <div className="w-6 h-6 rounded-full bg-premium-beige flex items-center justify-center text-xs font-bold">1</div>
            <span>Envie a mensagem pronta</span>
          </li>
          <li className="flex items-center gap-3 text-premium-brown">
            <div className="w-6 h-6 rounded-full bg-premium-beige flex items-center justify-center text-xs font-bold">2</div>
            <span>Envie sua foto favorita</span>
          </li>
          <li className="flex items-center gap-3 text-premium-brown">
            <div className="w-6 h-6 rounded-full bg-premium-beige flex items-center justify-center text-xs font-bold">3</div>
            <span>Aguarde nossa confirmação</span>
          </li>
        </ul>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="mt-12 premium-button-secondary w-full"
      >
        Voltar para a Loja
      </button>
    </motion.div>
  </div>
);

const ImageUpload = ({ onUpload, label }: { onUpload: (url: string) => void, label?: string }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    try {
      const compressedBlob = await compressImage(file);
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(p));
        }, 
        (error) => {
          console.error("Upload error:", error);
          alert("Erro ao fazer upload da imagem.");
          setUploading(false);
        }, 
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          onUpload(url);
          setUploading(false);
          setProgress(0);
        }
      );
    } catch (error) {
      console.error("Compression error:", error);
      alert("Erro ao processar imagem.");
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">{label}</label>}
      <div className="relative">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="hidden" 
          id={`file-upload-${label || 'default'}`}
          disabled={uploading}
        />
        <label 
          htmlFor={`file-upload-${label || 'default'}`}
          className={cn(
            "flex flex-col items-center justify-center gap-2 w-full premium-button-secondary py-3 cursor-pointer transition-all relative overflow-hidden",
            uploading && "opacity-80 cursor-not-allowed"
          )}
        >
          {uploading && (
            <div 
              className="absolute inset-0 bg-premium-terracotta/10 transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          )}
          <div className="flex items-center gap-2 relative z-10">
            <Camera size={18} />
            {uploading ? `Enviando... ${progress}%` : 'Escolher do Computador'}
          </div>
        </label>
      </div>
    </div>
  );
};

const AdminPanel = ({ onBack }: { onBack: () => void }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      
      const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      });

      const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
        if (snapshot.exists()) {
          setSettings({ id: snapshot.id, ...snapshot.data() } as Settings);
        }
      });

      return () => {
        unsubOrders();
        unsubProducts();
        unsubSettings();
      };
    }
  }, [isAuthorized]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.user === 'matheus' && loginData.pass === '2907') {
      setIsAuthorized(true);
      setLoginError('');
    } else {
      setLoginError('Usuário ou senha incorretos.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    if (!currentUser) {
      alert('Você precisa estar autenticado com o Google para salvar alterações no banco de dados.');
      return;
    }

    setIsSaving(true);
    try {
      const { id, ...data } = settings;
      await setDoc(doc(db, 'settings', 'global'), data);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Erro no login Google:', error);
      alert('Erro ao fazer login com Google');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    if (!currentUser) {
      alert('Você precisa estar autenticado com o Google para salvar produtos.');
      return;
    }

    try {
      if (editingProduct.id) {
        const { id, ...data } = editingProduct;
        await updateDoc(doc(db, 'products', id), data);
      } else {
        await addDoc(collection(db, 'products'), {
          ...editingProduct,
          active: true,
          featured: true,
          order: products.length + 1
        });
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  const toggleProductStatus = async (product: Product) => {
    if (!currentUser) {
      alert('Você precisa estar autenticado com o Google para alterar o status.');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'products', product.id), { active: !product.active });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${product.id}`);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-premium-beige">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-premium-beige">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-premium-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-premium-terracotta" />
            </div>
            <h2 className="text-2xl font-serif text-premium-brown">Acesso Restrito</h2>
            <p className="text-sm text-premium-warm-brown mt-2">Identifique-se para continuar</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Usuário</label>
              <input 
                type="text" 
                value={loginData.user} 
                onChange={e => setLoginData({...loginData, user: e.target.value})} 
                className="premium-input" 
                placeholder="Usuário"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Senha</label>
              <input 
                type="password" 
                value={loginData.pass} 
                onChange={e => setLoginData({...loginData, pass: e.target.value})} 
                className="premium-input" 
                placeholder="Senha"
              />
            </div>
            {loginError && <p className="text-xs text-red-500 font-medium">{loginError}</p>}
            <button type="submit" className="w-full premium-button-primary py-4">Entrar</button>
            <button type="button" onClick={onBack} className="w-full text-sm text-premium-warm-brown hover:text-premium-brown transition-colors">Voltar para o site</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium-offwhite">
      <div className="bg-white border-b border-premium-beige sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-premium-brown">Painel SB</h2>
          <button onClick={onBack} className="text-sm text-premium-warm-brown flex items-center gap-1">
            <ChevronLeft size={16} /> Site
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
            { id: 'products', label: 'Produtos', icon: Menu },
            { id: 'settings', label: 'Configurações', icon: AlertCircle }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "py-4 px-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2",
                activeTab === tab.id ? "border-premium-terracotta text-premium-terracotta" : "border-transparent text-premium-warm-brown"
              )}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentUser && (
          <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-2xl border border-premium-beige">
            <div className="flex items-center gap-3">
              {currentUser.photoURL && <img src={currentUser.photoURL} alt="" className="w-8 h-8 rounded-full" />}
              <div>
                <p className="text-xs font-bold text-premium-brown">{currentUser.displayName}</p>
                <p className="text-[10px] text-premium-warm-brown">{currentUser.email}</p>
              </div>
            </div>
            <button onClick={() => signOut(auth)} className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Sair</button>
          </div>
        )}

        {!currentUser && activeTab === 'settings' && (
          <div className="mb-6 p-6 bg-premium-terracotta/5 rounded-2xl border border-premium-terracotta/20 text-center">
            <p className="text-sm text-premium-brown mb-4">Para salvar alterações, você precisa estar autenticado como administrador.</p>
            <button 
              onClick={handleGoogleLogin}
              className="premium-button-secondary flex items-center gap-2 mx-auto"
            >
              <Instagram size={18} /> Login com Google Admin
            </button>
          </div>
        )}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="text-2xl font-serif text-premium-brown mb-6">Gestão de Pedidos</h3>
            {orders.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center border border-premium-beige">
                <p className="text-premium-warm-brown">Nenhum pedido encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orders.map(order => (
                  <div key={order.id} className="premium-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 bg-premium-beige rounded-md text-premium-warm-brown">{order.status}</span>
                        <span className="text-xs text-premium-warm-brown">{new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-lg font-serif text-premium-brown">{order.customerName}</h4>
                      <div className="mt-2 space-y-1">
                        {(order.items || []).map((item: any, i: number) => (
                          <p key={i} className="text-xs text-premium-warm-brown">
                            {item.productName} ({item.size}) x{item.quantity} - {formatPrice(item.price * item.quantity)}
                          </p>
                        ))}
                      </div>
                      <p className="text-sm font-bold text-premium-terracotta mt-2">Total: {formatPrice(order.total)}</p>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="premium-button-secondary py-2 px-4 text-xs flex items-center gap-2"
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif text-premium-brown">Produtos</h3>
              <button 
                onClick={() => { setEditingProduct({ name: '', price: 0, descriptionShort: '', descriptionFull: '', imageUrl: '', style: '', images: [], category: '' }); setIsProductModalOpen(true); }}
                className="premium-button-primary py-2 px-4 text-sm"
              >
                Novo Produto
              </button>
            </div>
            {!currentUser && (
              <div className="p-4 bg-premium-terracotta/5 rounded-2xl border border-premium-terracotta/20 text-center">
                <p className="text-xs text-premium-brown mb-2">Você precisa estar logado com Google para salvar alterações.</p>
                <button onClick={handleGoogleLogin} className="text-xs font-bold text-premium-terracotta underline">Fazer Login com Google</button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="premium-card">
                  <img src={product.imageUrl} className="h-40 w-full object-cover" referrerPolicy="no-referrer" />
                  <div className="p-4">
                    <h4 className="font-serif text-lg">{product.name}</h4>
                    <p className="text-[10px] text-premium-warm-brown uppercase tracking-wider">{product.style || 'Personalizado'}</p>
                    <p className="text-sm text-premium-terracotta font-bold">
                      A partir de {formatPrice(settings?.variations?.length ? Math.min(...settings.variations.map(v => v.price)) : product.price)}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }} className="text-xs text-premium-warm-brown underline">Editar</button>
                      <button onClick={() => toggleProductStatus(product)} className={cn("text-xs", product.active ? "text-red-500" : "text-green-500")}>
                        {product.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-8">
            <h3 className="text-2xl font-serif text-premium-brown">Configurações do Site</h3>
            <div className="space-y-6 bg-white p-8 rounded-3xl border border-premium-beige">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Nome da Loja</label>
                <input 
                  value={settings.storeName} 
                  onChange={e => setSettings({...settings, storeName: e.target.value})} 
                  className="premium-input" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Logo da Loja (Ícone da Aba)</label>
                <div className="flex gap-2">
                  <input 
                    value={settings.logoUrl || ''} 
                    onChange={e => setSettings({...settings, logoUrl: e.target.value})} 
                    className="premium-input flex-grow" 
                  />
                </div>
                <ImageUpload onUpload={(url) => setSettings({...settings, logoUrl: url})} />
                <p className="text-[10px] text-premium-warm-brown italic mt-1">Este ícone aparecerá na aba do navegador.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Banner Principal (URL da Foto)</label>
                <div className="flex gap-2">
                  <input 
                    value={settings.bannerUrl} 
                    onChange={e => setSettings({...settings, bannerUrl: e.target.value})} 
                    className="premium-input flex-grow" 
                  />
                </div>
                <ImageUpload onUpload={(url) => setSettings({...settings, bannerUrl: url})} />
                <p className="text-[10px] text-premium-warm-brown italic mt-1">Recomendado: 1920x650px para visualização completa.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">WhatsApp da Loja</label>
                <input 
                  value={settings.whatsappNumber} 
                  onChange={e => setSettings({...settings, whatsappNumber: e.target.value})} 
                  className="premium-input" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Instagram (Link)</label>
                <input 
                  value={settings.instagram} 
                  onChange={e => setSettings({...settings, instagram: e.target.value})} 
                  className="premium-input" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Informação de Frete</label>
                <textarea 
                  value={settings.shippingInfo} 
                  onChange={e => setSettings({...settings, shippingInfo: e.target.value})} 
                  className="premium-input min-h-[80px]" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Info Joinville</label>
                <input 
                  value={settings.joinvilleOnlyInfo} 
                  onChange={e => setSettings({...settings, joinvilleOnlyInfo: e.target.value})} 
                  className="premium-input" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Info Foto</label>
                <input 
                  value={settings.photoInfo} 
                  onChange={e => setSettings({...settings, photoInfo: e.target.value})} 
                  className="premium-input" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Prazo de Entrega</label>
                <input 
                  value={settings.deadlineInfo} 
                  onChange={e => setSettings({...settings, deadlineInfo: e.target.value})} 
                  className="premium-input" 
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-premium-beige">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Categorias de Produtos</label>
                <div className="space-y-2">
                  {(settings.categories || []).map((cat, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        value={cat} 
                        onChange={e => {
                          const newCats = [...(settings.categories || [])];
                          newCats[idx] = e.target.value;
                          setSettings({...settings, categories: newCats});
                        }} 
                        className="premium-input flex-grow" 
                        placeholder="Nome da categoria"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newCats = (settings.categories || []).filter((_, i) => i !== idx);
                          setSettings({...settings, categories: newCats});
                        }}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setSettings({...settings, categories: [...(settings.categories || []), '']})}
                    className="w-full premium-button-secondary py-3 text-xs"
                  >
                    + Adicionar Categoria
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-premium-beige">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Variações de Tamanho e Preço</label>
                <div className="space-y-2">
                  {(settings.variations || []).map((v, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        value={v.name} 
                        onChange={e => {
                          const newVars = [...(settings.variations || [])];
                          newVars[idx] = { ...v, name: e.target.value };
                          setSettings({...settings, variations: newVars});
                        }} 
                        className="premium-input flex-grow" 
                        placeholder="Nome (ex: 10x15cm)"
                      />
                      <input 
                        type="number"
                        value={v.price} 
                        onChange={e => {
                          const newVars = [...(settings.variations || [])];
                          newVars[idx] = { ...v, price: Number(e.target.value) };
                          setSettings({...settings, variations: newVars});
                        }} 
                        className="premium-input w-24" 
                        placeholder="Preço"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newVars = (settings.variations || []).filter((_, i) => i !== idx);
                          setSettings({...settings, variations: newVars});
                        }}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setSettings({...settings, variations: [...(settings.variations || []), { name: '', price: 0 }]})}
                    className="w-full premium-button-secondary py-3 text-xs"
                  >
                    + Adicionar Variação
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full premium-button-primary flex items-center justify-center gap-2"
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}
      </div>

      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-serif text-premium-brown mb-6">{editingProduct.id ? 'Editar Produto' : 'Novo Produto'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Nome do Produto</label>
                  <input placeholder="Ex: Modelo Mãe" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="premium-input" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Estilo (Subtítulo)</label>
                  <input placeholder="Ex: Ilustração em Aquarela" value={editingProduct.style} onChange={e => setEditingProduct({...editingProduct, style: e.target.value})} className="premium-input" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Preço Base (A partir de)</label>
                  <input type="number" placeholder="Preço" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="premium-input" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Categoria</label>
                  <select 
                    value={editingProduct.category || ''} 
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} 
                    className="premium-input"
                  >
                    <option value="">Sem Categoria</option>
                    {(settings?.categories || []).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Imagem Principal (URL)</label>
                <div className="flex gap-2">
                  <input placeholder="URL da Imagem" value={editingProduct.imageUrl} onChange={e => setEditingProduct({...editingProduct, imageUrl: e.target.value})} className="premium-input flex-grow" required />
                </div>
                <ImageUpload onUpload={(url) => setEditingProduct({...editingProduct, imageUrl: url})} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Galeria de Imagens (Opcional)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(editingProduct.images || []).map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={img} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => {
                          const newImgs = [...(editingProduct.images || [])];
                          newImgs.splice(idx, 1);
                          setEditingProduct({...editingProduct, images: newImgs});
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="aspect-square border-2 border-dashed border-premium-beige rounded-lg flex items-center justify-center">
                    <ImageUpload onUpload={(url) => setEditingProduct({...editingProduct, images: [...(editingProduct.images || []), url]})} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Descrição Curta</label>
                <textarea placeholder="Descrição Curta" value={editingProduct.descriptionShort} onChange={e => setEditingProduct({...editingProduct, descriptionShort: e.target.value})} className="premium-input" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-premium-warm-brown">Descrição Completa</label>
                <textarea placeholder="Descrição Completa" value={editingProduct.descriptionFull} onChange={e => setEditingProduct({...editingProduct, descriptionFull: e.target.value})} className="premium-input min-h-[100px]" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-grow premium-button-primary">Salvar</button>
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-grow premium-button-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'home' | 'form' | 'summary' | 'success' | 'admin'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('sb_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error loading cart", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sb_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, size: string, price: number) => {
    const newItem: CartItem = {
      id: `${product.id}-${size}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: price,
      quantity: 1,
      size: size,
      imageUrl: product.imageUrl
    };
    setCart(prev => [...prev, newItem]);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id: string, q: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: q } : item));
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setView('form');
  };

  useEffect(() => {
    if (settings?.storeName) {
      document.title = settings.storeName;
    }
    if (settings?.logoUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.logoUrl;
    }
  }, [settings]);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('active', '==', true), orderBy('order', 'asc'));
    const unsubProducts = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ id: snapshot.id, ...snapshot.data() } as Settings);
      } else {
        // Seed default settings if they don't exist
        const defaultSettings: Omit<Settings, 'id'> = {
          storeName: 'SB PRESENTES',
          whatsappNumber: WHATSAPP_NUMBER,
          instagram: 'https://instagram.com',
          bannerUrl: 'https://picsum.photos/seed/mother/1920/1080',
          logoUrl: '',
          shippingInfo: 'O valor do frete é calculado com base no seu bairro e será informado durante o atendimento no WhatsApp.',
          joinvilleOnlyInfo: 'Apenas Joinville/SC',
          photoInfo: 'Personalizado com foto enviada pelo cliente após o pedido.',
          deadlineInfo: 'Pedidos até 08/05',
          paymentLinkInfo: 'o link de pagamento pode ter juros da operadora',
          categories: ['Quadros', 'Canecas', 'Cestas'],
          variations: [
            { name: '10x15 cm', price: 50 },
            { name: '21x30 cm (A4)', price: 90 }
          ]
        };
        setDoc(doc(db, 'settings', 'global'), defaultSettings);
      }
    });

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleOrderSubmit = (data: any) => {
    setOrderData(data);
    setView('summary');
  };

  const handleConfirmOrder = async () => {
    if (cart.length === 0 || !orderData) return;

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newOrder: Order = {
      ...orderData,
      items: cart,
      status: 'novo',
      createdAt: serverTimestamp(),
      total: total
    };

    try {
      await addDoc(collection(db, 'orders'), newOrder);
      
      // Build WhatsApp message
      let itemsList = cart.map(item => 
        `- ${item.name} (${item.size}) x${item.quantity}: ${formatPrice(item.price * item.quantity)}`
      ).join('\n');

      const deliveryInfo = orderData.deliveryType === 'entrega' 
        ? `*Endereço de Entrega:*
Bairro: ${orderData.bairro || 'Não informado'}
Endereço: ${orderData.address || 'Não informado'}
Complemento/Referência: ${orderData.complement || 'Nenhum'}`
        : `*Forma de Recebimento:* Retirada no Bairro Aventureiro`;

      const message = `Olá, quero fazer um pedido na SB Presentes.

*Resumo do Pedido:*
${itemsList}

*Total: ${formatPrice(total)}*

*Dados do Cliente:*
Nome: ${orderData.customerName}
Telefone: ${orderData.customerPhone}

${deliveryInfo}

*Informações Adicionais:*
Nome da pessoa presenteada: ${orderData.recipientName || 'Não informado'}
Ocasião: ${orderData.occasion || 'Não informado'}
Data desejada: ${orderData.deliveryDate || 'A combinar'}
Período: ${orderData.deliveryPeriod}
Forma de pagamento: ${orderData.paymentMethod}

Observações: ${orderData.observations || 'Nenhuma'}

*Aviso:* Estou ciente do prazo de 2 dias úteis para produção e entrega/retirada.

Quero confirmar meu pedido.`;

      const whatsappUrl = `https://wa.me/${settings?.whatsappNumber || WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      setCart([]); // Clear cart after order
      setView('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  if (view === 'admin') return <AdminPanel onBack={() => setView('home')} />;

  return (
    <div className="min-h-screen">
      <Navbar 
        onAdminClick={() => setView('admin')} 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />
      
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Hero onScrollToProducts={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })} />
            
            <section id="products" className="py-20 px-4 bg-premium-beige/20">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-serif text-premium-brown mb-4">Nossos Presentes</h2>
                  <p className="text-premium-warm-brown max-w-xl mx-auto">Escolha o modelo ideal para surpreender sua mãe com uma memória inesquecível.</p>
                </div>

                {settings?.categories && settings.categories.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-8 justify-center">
                    <button 
                      onClick={() => setSelectedCategory('Todos')}
                      className={cn(
                        "px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                        selectedCategory === 'Todos' 
                          ? "bg-premium-terracotta text-white border-premium-terracotta" 
                          : "bg-white text-premium-warm-brown border-premium-beige hover:border-premium-terracotta"
                      )}
                    >
                      Todos
                    </button>
                    {settings.categories.map((cat, i) => (
                      <button 
                        key={i}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                          selectedCategory === cat 
                            ? "bg-premium-terracotta text-white border-premium-terracotta" 
                            : "bg-white text-premium-warm-brown border-premium-beige hover:border-premium-terracotta"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
                
                {loading ? (
                  <div className="flex justify-center">Carregando produtos...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products
                      .filter(p => selectedCategory === 'Todos' || p.category === selectedCategory)
                      .map(product => (
                      <div key={product.id}>
                        <ProductCard 
                          product={product} 
                          onSelect={handleProductSelect} 
                          variations={settings?.variations || []}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="py-20 px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-serif text-premium-brown text-center mb-12">Como Funciona</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {[
                    { icon: ShoppingBag, title: "Escolha", desc: "Selecione o modelo" },
                    { icon: Menu, title: "Dados", desc: "Preencha o formulário" },
                    { icon: MessageCircle, title: "WhatsApp", desc: "Finalize o pedido" },
                    { icon: Camera, title: "Foto", desc: "Envie sua foto" },
                    { icon: Truck, title: "Receba", desc: "Entrega em Joinville" },
                  ].map((step, i) => (
                    <div key={i} className="text-center space-y-3">
                      <div className="w-12 h-12 bg-premium-terracotta/10 rounded-full flex items-center justify-center mx-auto text-premium-terracotta">
                        <step.icon size={24} />
                      </div>
                      <h4 className="font-serif font-bold text-premium-brown">{step.title}</h4>
                      <p className="text-xs text-premium-warm-brown">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="py-20 px-4 bg-premium-brown text-premium-offwhite">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-serif text-center mb-12">Dúvidas Frequentes</h2>
                <div className="space-y-6">
                  {[
                    { q: "Como envio a foto?", a: "Após finalizar o pedido no site, você será redirecionado para o nosso WhatsApp. Lá, você deve enviar a foto que deseja usar no quadro." },
                    { q: "Vocês entregam fora de Joinville?", a: "No momento, realizamos entregas exclusivamente na cidade de Joinville/SC." },
                    { q: "Como funciona o frete?", a: "O valor do frete é calculado com base no seu bairro e será informado durante o atendimento no WhatsApp." },
                    { q: "Até quando posso pedir?", a: "Aceitaremos pedidos para o Dia das Mães até o dia 08/05, sujeitos à disponibilidade de estoque." },
                  ].map((faq, i) => (
                    <div key={i} className="border-b border-premium-offwhite/10 pb-6">
                      <h4 className="font-serif text-lg mb-2">{faq.q}</h4>
                      <p className="text-sm text-premium-offwhite/70 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <footer className="py-10 px-4 text-center text-premium-warm-brown text-sm">
              <p className="mb-4">© 2026 {settings?.storeName || 'SB Presentes'}. Todos os direitos reservados.</p>
              <div className="flex justify-center gap-6">
                <a href={settings?.instagram || `https://instagram.com`} target="_blank" rel="noopener noreferrer" className="hover:text-premium-terracotta transition-colors flex items-center gap-1">
                  <Instagram size={16} /> Instagram
                </a>
              </div>
            </footer>
          </motion.div>
        )}

        {view === 'form' && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <OrderForm 
              items={cart} 
              onBack={() => setView('home')} 
              onSubmit={handleOrderSubmit} 
            />
          </motion.div>
        )}

        {view === 'summary' && orderData && (
          <motion.div 
            key="summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <OrderSummary 
              items={cart} 
              orderData={orderData} 
              onBack={() => setView('form')} 
              onConfirm={handleConfirmOrder} 
            />
          </motion.div>
        )}

        {view === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <SuccessScreen />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProduct && view === 'home' && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onAddToCart={addToCart}
            variations={settings?.variations || []}
          />
        )}
        {isCartOpen && (
          <CartView 
            cart={cart} 
            onClose={() => setIsCartOpen(false)} 
            onRemove={removeFromCart}
            onUpdateQuantity={updateCartQuantity}
            onCheckout={handleCheckout}
          />
        )}
      </AnimatePresence>

      <a 
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 p-4 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}
