import { motion } from "motion/react";

interface DiceFaceProps {
  value: number; // 1 to 6
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glowColor?: 'cyan' | 'emerald' | 'zinc';
}

export function DiceFace({ value, size = 'md', glowColor = 'cyan' }: DiceFaceProps) {
  // Configurações de tamanho
  const sizeMap = {
    sm: "w-8 h-8 p-1 gap-0.5",
    md: "w-12 h-12 p-1.5 gap-1",
    lg: "w-16 h-16 p-2 gap-1.5",
    xl: "w-24 h-24 p-3 gap-2"
  };

  const pipSizeMap = {
    sm: "w-1.5 h-1.5",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4"
  };

  // Configurações de cor (Borda/Fundo e Pip)
  const colorMap = {
    cyan: {
      bg: "bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]",
      pip: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
    },
    emerald: {
      bg: "bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]",
      pip: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
    },
    zinc: {
      bg: "bg-zinc-900/60 border-zinc-600/50 shadow-[0_0_10px_rgba(255,255,255,0.1)]",
      pip: "bg-zinc-400 shadow-[0_0_5px_rgba(255,255,255,0.4)]"
    }
  };

  const currentSize = sizeMap[size];
  const currentPipSize = pipSizeMap[size];
  const currentColors = colorMap[glowColor];

  // Helper para renderizar os pontinhos
  const Pip = ({ visible }: { visible: boolean }) => (
    <div className={`${currentPipSize} rounded-full ${visible ? currentColors.pip : 'bg-transparent'} transition-all`} />
  );

  // Mapeamento das posições dos pontos p/ cada face (Matriz 3x3)
  const getPips = (val: number) => {
    switch (val) {
      case 1: return [false, false, false, false, true, false, false, false, false];
      case 2: return [true, false, false, false, false, false, false, false, true];
      case 3: return [true, false, false, false, true, false, false, false, true];
      case 4: return [true, false, true, false, false, false, true, false, true];
      case 5: return [true, false, true, false, true, false, true, false, true];
      case 6: return [true, false, true, true, false, true, true, false, true];
      default: return [false, false, false, false, false, false, false, false, false];
    }
  };

  const pips = getPips(value);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative flex flex-col justify-between rounded-xl border-2 backdrop-blur-md
        ${currentSize}
        ${currentColors.bg}
      `}
    >
      <div className="flex justify-between w-full">
        <Pip visible={pips[0]} />
        <Pip visible={pips[1]} />
        <Pip visible={pips[2]} />
      </div>
      <div className="flex justify-between w-full">
        <Pip visible={pips[3]} />
        <Pip visible={pips[4]} />
        <Pip visible={pips[5]} />
      </div>
      <div className="flex justify-between w-full">
        <Pip visible={pips[6]} />
        <Pip visible={pips[7]} />
        <Pip visible={pips[8]} />
      </div>
      
      {/* Reflexo de Vidro (Glass Shimmer) */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl pointer-events-none" />
    </motion.div>
  );
}
