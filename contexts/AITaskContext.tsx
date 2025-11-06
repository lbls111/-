import React, { createContext, useState, useCallback, useRef } from 'react';
import type { AITaskContextType } from '../types';

export const AITaskContext = createContext<AITaskContextType>({
  isPaused: false,
  togglePause: () => {},
  registerController: () => {},
  unregisterController: () => {},
});

export const AITaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPaused, setIsPaused] = useState(false);
  const activeControllers = useRef(new Set<AbortController>());

  const registerController = useCallback((controller: AbortController) => {
    activeControllers.current.add(controller);
  }, []);

  const unregisterController = useCallback((controller: AbortController) => {
    activeControllers.current.delete(controller);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prevIsPaused => {
      const newIsPaused = !prevIsPaused;
      if (newIsPaused) {
        // When pausing, abort all active controllers
        console.warn('Pausing all AI tasks. Aborting active requests.');
        activeControllers.current.forEach(controller => {
          controller.abort();
        });
        // Clear the set as they are now aborted
        activeControllers.current.clear();
      } else {
        console.log('Resuming AI tasks. New tasks can now be started.');
      }
      return newIsPaused;
    });
  }, []);

  const contextValue = {
    isPaused,
    togglePause,
    registerController,
    unregisterController,
  };

  return (
    <AITaskContext.Provider value={contextValue}>
      {children}
    </AITaskContext.Provider>
  );
};
