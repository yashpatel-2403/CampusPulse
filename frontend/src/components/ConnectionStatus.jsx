import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectionStatus() {
  const { connected, connectionError } = useSocket();

  return (
    <AnimatePresence>
      {!connected && connectionError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-4 right-4 z-50 bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-md max-w-xs"
        >
          <div className="flex items-start gap-3">
            <div className="text-lg flex-shrink-0 mt-0.5">⚠️</div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-900 mb-0.5">Connection Status</p>
              <p className="text-xs text-amber-700">{connectionError}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
