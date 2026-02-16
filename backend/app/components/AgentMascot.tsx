'use client';

import { motion } from 'framer-motion';

interface AgentMascotProps {
  agentId: string;
  isActive?: boolean;
  isHovered?: boolean;
}

export function AgentMascot({ agentId, isActive = false, isHovered = false }: AgentMascotProps) {
  const getMascotConfig = () => {
    switch (agentId) {
      case 'code-specialist':
        return {
          image: 'https://ik.imagekit.io/ideas365logo/1770350699364(1).png?updatedAt=1771193412500',
          color: '#5E9BEB',
          name: 'Code Specialist'
        };
      case 'creative-director':
        return {
          image: 'https://ik.imagekit.io/ideas365logo/1770350880742(1).png?updatedAt=1771193408730',
          color: '#EB5463',
          name: 'Creative Director'
        };
      case 'data-strategist':
        return {
          image: 'https://ik.imagekit.io/ideas365logo/1770351112298(1).png?updatedAt=1771193406879',
          color: '#FFCE55',
          name: 'Data Strategist'
        };
      case 'growth-hacker':
        return {
          image: 'https://ik.imagekit.io/ideas365logo/1770350711413(3).png?updatedAt=1771193407768',
          color: '#9FD369',
          name: 'Growth Hacker'
        };
      case 'orchestrator':
        return {
          image: 'https://ik.imagekit.io/ideas365logo/1771043991963(1).png?updatedAt=1771193405779',
          color: '#A0A0A0',
          name: 'Orchestrator'
        };
      default:
        return {
          image: 'https://ik.imagekit.io/ideas365logo/1771043991963(1).png?updatedAt=1771193405779',
          color: '#5E9BEB',
          name: 'Agent'
        };
    }
  };

  const config = getMascotConfig();

  const containerVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      y: 0
    },
    hover: {
      scale: 1.1,
      rotate: [0, -5, 5, -5, 0],
      y: -5
    },
    active: {
      scale: 1.05,
      y: -3
    }
  };

  const glowVariants = {
    idle: {
      opacity: 0
    },
    active: {
      opacity: 0.6,
      scale: [1, 1.2, 1]
    }
  };

  const faceVariants = {
    idle: {
      scale: 1,
      rotate: 0
    },
    hover: {
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0]
    }
  };

  const renderCharacter = () => {
    return (
      <motion.img
        src={config.image}
        alt={config.name}
        className="w-full h-full object-contain"
        style={{
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
        }}
        variants={faceVariants}
        animate={isHovered ? "hover" : "idle"}
        transition={{
          duration: 0.6,
          repeat: isHovered ? Infinity : 0,
          repeatDelay: 1.5
        }}
      />
    );
  };

  return (
    <div className="relative w-14 h-14 md:w-16 md:h-16">
      {/* Glow effect when active */}
      <motion.div
        className="absolute inset-0 rounded-full blur-lg"
        style={{ backgroundColor: config.color }}
        variants={glowVariants}
        initial="idle"
        animate={isActive ? "active" : "idle"}
        transition={{
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      />

      {/* Main mascot */}
      <motion.div
        className="relative z-10"
        variants={containerVariants}
        initial="idle"
        animate={isActive ? "active" : isHovered ? "hover" : "idle"}
        transition={
          isHovered
            ? {
                rotate: {
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 1
                },
                scale: { duration: 0.3 },
                y: { duration: 0.3 }
              }
            : { duration: 0.3 }
        }
      >
        {renderCharacter()}
      </motion.div>
    </div>
  );
}
