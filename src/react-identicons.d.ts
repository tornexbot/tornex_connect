// src/react-identicons.d.ts
declare module 'react-identicons' {
    import { ComponentType } from 'react';
    
    interface IdenticonProps {
      string: string;
      size?: number;
      padding?: number;
      bg?: string;
      fg?: string;
      palette?: string[];
      count?: number;
    }
  
    const Identicon: ComponentType<IdenticonProps>;
    export default Identicon;
  }