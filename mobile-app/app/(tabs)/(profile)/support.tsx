import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import AppHeader from '@/components/AppHeader';
import {
  Mail,
  Phone,
  MessageSquare,
  HelpCircle,
  Send,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';

const SUPPORT_EMAIL = 'support@chownow.com';
const SUPPORT_PHONE = '+234 800 123 4567';

const TICKET_CATEGORIES = [
  { label: 'Order Issue', value: 'order_issue' },
  { label: 'Payment Problem', value: 'payment_problem' },
  { label: 'Account Help', value: 'account_help' },
  { label: 'Delivery Issue', value: 'delivery_issue' },
  { label: 'Product Quality', value: 'product_quality' },
  { label: 'Technical Issue', value: 'technical_issue' },
  { label: 'Feature Request', value: 'feature_request' },
  { label: 'Other', value: 'other' },
];

export default function Support() {
  const { colors } = useTheme();
  const profile = useUserStore((state) => state.profile);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCallSupport = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`);
  };

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim()) {
      Alert.alert('Required', 'Please enter a subject');
      return;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe your issue');
      return;
    }

    try {
      setSubmitting(true);

      // Create support ticket
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: profile?.id,
          subject: subject.trim(),
          category,
          description: description.trim(),
          status: 'open',
          priority: 'medium',
        })
        .select()
        .single();

      if (error) throw error;

      // Get all admin users
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'admin');

      // Create notifications for all admins
      if (adminUsers && adminUsers.length > 0) {
        const categoryLabel =
          TICKET_CATEGORIES.find((cat) => cat.value === category)?.label ||
          category;

        const notifications = adminUsers.map((admin) => ({
          user_id: admin.id,
          title: '🎫 New Support Ticket',
          message: `${
            profile?.full_name || 'A user'
          } submitted a ${categoryLabel} ticket: ${subject.trim()}`,
          type: 'support_ticket',
          related_id: ticket.id,
          is_read: false,
        }));

        await supabase.from('notifications').insert(notifications);
      }

      Alert.alert(
        'Ticket Submitted! 🎫',
        'Your support ticket has been submitted. Our team will get back to you within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSubject('');
              setCategory('');
              setDescription('');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      Alert.alert('Error', error.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <AppHeader title="Support" />
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Contact Information Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Contact Us
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            Get in touch with our support team
          </Text>

          <TouchableOpacity
            style={[
              styles.contactCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleEmailSupport}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Mail size={24} color={colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text
                style={[styles.contactLabel, { color: colors.textSecondary }]}
              >
                Email
              </Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>
                {SUPPORT_EMAIL}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.contactCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleCallSupport}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.secondary + '20' },
              ]}
            >
              <Phone size={24} color={colors.secondary} />
            </View>
            <View style={styles.contactInfo}>
              <Text
                style={[styles.contactLabel, { color: colors.textSecondary }]}
              >
                Phone
              </Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>
                {SUPPORT_PHONE}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Submit Ticket Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={24} color={colors.primary} />
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginLeft: 8 },
              ]}
            >
              Submit a Support Ticket
            </Text>
          </View>
          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            Fill out the form below and we will respond within 24 hours
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Subject *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Brief description of your issue"
                placeholderTextColor={colors.textSecondary + '80'}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Category *
              </Text>
              <View style={styles.categoryGrid}>
                {TICKET_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: colors.filter,
                        borderColor: colors.border,
                      },
                      category === cat.value && {
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: colors.text },
                        category === cat.value && {
                          color: colors.primary,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Description *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Please provide as much detail as possible about your issue..."
                placeholderTextColor={colors.textSecondary + '80'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                submitting && { opacity: 0.6 },
              ]}
              onPress={handleSubmitTicket}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Send size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit Ticket</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <View style={styles.sectionHeader}>
            <HelpCircle size={24} color={colors.secondary} />
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginLeft: 8 },
              ]}
            >
              Frequently Asked Questions
            </Text>
          </View>

          <View
            style={[
              styles.faqCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              How long does delivery take?
            </Text>
            <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
              Delivery typically takes 1-2 hours depending on your location and
              vendor availability.
            </Text>
          </View>

          <View
            style={[
              styles.faqCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              How do I track my order?
            </Text>
            <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
              Go to the Orders tab to see real-time updates on your order status
              and driver location.
            </Text>
          </View>

          <View
            style={[
              styles.faqCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              What payment methods do you accept?
            </Text>
            <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
              We accept card payments and bank transfers via Paystack. Wallet
              payments coming soon.
            </Text>
          </View>

          <View
            style={[
              styles.faqCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              How do I become a vendor?
            </Text>
            <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
              Go to Profile → Become a Vendor and fill out the application form.
              We will review it within 2-3 business days.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  faqCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
});
