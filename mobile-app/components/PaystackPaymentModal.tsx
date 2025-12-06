import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Paystack, paystackProps } from 'react-native-paystack-webview';
import { X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface PaystackPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (response: any) => void;
  onCancel: () => void;
  email: string;
  amount: number;
  reference: string;
  channels?: string[];
}

export default function PaystackPaymentModal({
  visible,
  onClose,
  onSuccess,
  onCancel,
  email,
  amount,
  reference,
  channels = ['card', 'bank', 'ussd', 'qr', 'bank_transfer'],
}: PaystackPaymentModalProps) {
  const { colors } = useTheme();
  const paystackWebViewRef = React.useRef<paystackProps.PayStackRef>();

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Complete Payment</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Paystack
          paystackKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY!}
          billingEmail={email}
          amount={amount * 100}
          channels={channels}
          reference={reference}
          onCancel={(e) => {
            console.log('Payment cancelled:', e);
            onCancel();
            onClose();
          }}
          onSuccess={(res) => {
            console.log('Payment successful:', res);
            onSuccess(res);
            onClose();
          }}
          ref={paystackWebViewRef}
          activityIndicatorColor={colors.primary}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
});
