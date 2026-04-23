// src/services/emailService.ts
import emailjs from '@emailjs/browser';

class EmailService {
  private static instance: EmailService;
  private initialized = false;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private checkConfig() {
    // Usar REACT_APP_ em vez de VITE_
    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

    console.log('🔧 Verificando configuração do EmailJS:');
    console.log('   REACT_APP_EMAILJS_SERVICE_ID:', serviceId || '❌ não definido');
    console.log('   REACT_APP_EMAILJS_TEMPLATE_ID:', templateId || '❌ não definido');
    console.log('   REACT_APP_EMAILJS_PUBLIC_KEY:', publicKey || '❌ não definido');

    if (!serviceId || !templateId || !publicKey) {
      console.warn('⚠️ Variáveis de ambiente do EmailJS não configuradas');
      return false;
    }

    if (!this.initialized) {
      emailjs.init(publicKey);
      this.initialized = true;
    }
    
    return true;
  }

  async sendRecoveryCode(emailData: { to_email: string; to_name: string; codigo: string; userType?: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const isConfigured = this.checkConfig();
      
      if (!isConfigured) {
        console.log('⚠️ EmailJS não configurado. Código gerado:', emailData.codigo);
        
        // Em desenvolvimento, mostrar o código no console
        if (process.env.NODE_ENV === 'development') {
          alert(`🔐 CÓDIGO (DEV): ${emailData.codigo}\n\nEmailJS não configurado. Use este código para teste.`);
        }
        
        return {
          success: true,
          message: 'Código gerado (modo desenvolvimento)'
        };
      }

      console.log('📧 Enviando email para:', emailData.to_email);

      const templateParams = {
        to_email: emailData.to_email,
        to_name: emailData.to_name,
        codigo: emailData.codigo,
        user_type: emailData.userType === 'organizer' ? 'Organizador' : 
                  emailData.userType === 'admin' ? 'Administrador' : 'Usuário',
        subject: `🔐 Código de Recuperação de Senha - ${emailData.userType || 'Usuário'} - Cresce.AO`,
        reply_to: 'naoresponder@cresceao.com'
      };

      const response = await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID!,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID!,
        templateParams
      );

      console.log('✅ Email enviado com sucesso:', response);

      return {
        success: true,
        message: 'Código enviado para seu email! Verifique sua caixa de entrada.'
      };

    } catch (error: any) {
      console.error('❌ Erro ao enviar email:', error);

      let errorMessage = 'Erro ao enviar email. ';
      
      if (error?.text) {
        errorMessage += error.text;
      } else if (error?.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Tente novamente mais tarde.';
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const isConfigured = this.checkConfig();
      if (!isConfigured) return false;

      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID!,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID!,
        {
          to_email: 'teste@email.com',
          to_name: 'Teste',
          codigo: '000000',
          subject: 'Teste de Conexão'
        }
      );
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão:', error);
      return false;
    }
  }
}

export const emailService = EmailService.getInstance();