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
          shape: 'triangle',
          color: '#5E9BEB',
          eyes: { left: { x: 25, y: 30 }, right: { x: 45, y: 30 } },
          face: '😊'
        };
      case 'creative-director':
        return {
          shape: 'circle',
          color: '#EB5463',
          eyes: { left: { x: 30, y: 35 }, right: { x: 50, y: 35 } },
          face: '✨'
        };
      case 'data-strategist':
        return {
          shape: 'star',
          color: '#FFCE55',
          eyes: { left: { x: 30, y: 32 }, right: { x: 50, y: 32 } },
          face: '📊'
        };
      case 'growth-hacker':
        return {
          shape: 'pill',
          color: '#9FD369',
          eyes: { left: { x: 28, y: 35 }, right: { x: 52, y: 35 } },
          face: '🚀'
        };
      default:
        return {
          shape: 'circle',
          color: '#5E9BEB',
          eyes: { left: { x: 30, y: 35 }, right: { x: 50, y: 35 } },
          face: '🤖'
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

  const renderShape = () => {
    const baseStyle = {
      fill: config.color,
      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
    };

    switch (config.shape) {
      case 'triangle':
        return (
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <defs>
              <linearGradient id={`grad-${agentId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={config.color} stopOpacity="1" />
                <stop offset="100%" stopColor={config.color} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <polygon
              points="40,10 70,65 10,65"
              fill={`url(#grad-${agentId})`}
              style={baseStyle}
            />
            <circle cx={config.eyes.left.x} cy={config.eyes.left.y} r="3" fill="white" />
            <circle cx={config.eyes.right.x} cy={config.eyes.right.y} r="3" fill="white" />
            <circle cx={config.eyes.left.x + 1} cy={config.eyes.left.y} r="1.5" fill="#2D3748" />
            <circle cx={config.eyes.right.x + 1} cy={config.eyes.right.y} r="1.5" fill="#2D3748" />
            <motion.text
              x="40"
              y="55"
              fontSize="16"
              textAnchor="middle"
              variants={faceVariants}
              animate={isHovered ? "hover" : "idle"}
              transition={{
                duration: 0.6,
                repeat: isHovered ? Infinity : 0,
                repeatDelay: 1.5
              }}
            >
              {config.face}
            </motion.text>
          </svg>
        );

      case 'circle':
        return (
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <defs>
              <radialGradient id={`grad-${agentId}`}>
                <stop offset="0%" stopColor={config.color} stopOpacity="1" />
                <stop offset="100%" stopColor={config.color} stopOpacity="0.8" />
              </radialGradient>
            </defs>
            <circle
              cx="40"
              cy="40"
              r="30"
              fill={`url(#grad-${agentId})`}
              style={baseStyle}
            />
            <circle cx={config.eyes.left.x} cy={config.eyes.left.y} r="4" fill="white" />
            <circle cx={config.eyes.right.x} cy={config.eyes.right.y} r="4" fill="white" />
            <circle cx={config.eyes.left.x + 1} cy={config.eyes.left.y} r="2" fill="#2D3748" />
            <circle cx={config.eyes.right.x + 1} cy={config.eyes.right.y} r="2" fill="#2D3748" />
            <motion.text
              x="40"
              y="58"
              fontSize="18"
              textAnchor="middle"
              variants={faceVariants}
              animate={isHovered ? "hover" : "idle"}
              transition={{
                duration: 0.6,
                repeat: isHovered ? Infinity : 0,
                repeatDelay: 1.5
              }}
            >
              {config.face}
            </motion.text>
          </svg>
        );

      case 'star':
        return (
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <defs>
              <linearGradient id={`grad-${agentId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={config.color} stopOpacity="1" />
                <stop offset="100%" stopColor={config.color} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <motion.path
              d="M40,5 L47,30 L72,30 L52,45 L59,70 L40,55 L21,70 L28,45 L8,30 L33,30 Z"
              fill={`url(#grad-${agentId})`}
              style={baseStyle}
              animate={isHovered ? { rotate: 360 } : {}}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <circle cx={config.eyes.left.x} cy={config.eyes.left.y} r="3" fill="white" />
            <circle cx={config.eyes.right.x} cy={config.eyes.right.y} r="3" fill="white" />
            <circle cx={config.eyes.left.x + 1} cy={config.eyes.left.y} r="1.5" fill="#2D3748" />
            <circle cx={config.eyes.right.x + 1} cy={config.eyes.right.y} r="1.5" fill="#2D3748" />
            <motion.text
              x="40"
              y="52"
              fontSize="16"
              textAnchor="middle"
              variants={faceVariants}
              animate={isHovered ? "hover" : "idle"}
              transition={{
                duration: 0.6,
                repeat: isHovered ? Infinity : 0,
                repeatDelay: 1.5
              }}
            >
              {config.face}
            </motion.text>
          </svg>
        );

      case 'pill':
        return (
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <defs>
              <linearGradient id={`grad-${agentId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={config.color} stopOpacity="1" />
                <stop offset="100%" stopColor={config.color} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <rect
              x="15"
              y="25"
              width="50"
              height="30"
              rx="15"
              fill={`url(#grad-${agentId})`}
              style={baseStyle}
            />
            <circle cx={config.eyes.left.x} cy={config.eyes.left.y} r="3.5" fill="white" />
            <circle cx={config.eyes.right.x} cy={config.eyes.right.y} r="3.5" fill="white" />
            <circle cx={config.eyes.left.x + 1} cy={config.eyes.left.y} r="2" fill="#2D3748" />
            <circle cx={config.eyes.right.x + 1} cy={config.eyes.right.y} r="2" fill="#2D3748" />
            <motion.text
              x="40"
              y="53"
              fontSize="16"
              textAnchor="middle"
              variants={faceVariants}
              animate={isHovered ? "hover" : "idle"}
              transition={{
                duration: 0.6,
                repeat: isHovered ? Infinity : 0,
                repeatDelay: 1.5
              }}
            >
              {config.face}
            </motion.text>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative w-12 h-12 md:w-14 md:h-14">
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
        {renderShape()}
      </motion.div>
    </div>
  );
}
