export interface MensagemChatUI {
  id: string;
  papel: 'usuario' | 'assistente' | 'sistema';
  conteudo: string;
  timestamp: string;
}
