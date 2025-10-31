import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/styles/typography';
import React from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { ScrollView } from 'react-native-gesture-handler';
import ReviewCard from '@/components/ReviewCard';

const mockReviews = [
  {
    reviewer: 'Jane Doe',
    rating: 5,
    text: 'Amazing food and great service!',
    date: '2024-06-01',
  },
  {
    reviewer: 'John Smith',
    rating: 4,
    text: 'Good experience, but a bit pricey.',
    date: '2024-05-28',
  },
  {
    reviewer: 'Mary Johnson',
    rating: 5,
    text: 'Best item in town!',
    date: '2024-05-20',
  },
  {
    reviewer: 'Alex Lee',
    rating: 3,
    text: 'Average food, nice ambiance.',
    date: '2024-05-15',
  },
  {
    reviewer: 'Chris Kim',
    rating: 2,
    text: 'Waited too long for my order.',
    date: '2024-05-10',
  },
  {
    reviewer: 'Patricia Brown',
    rating: 1,
    text: 'Very disappointed.',
    date: '2024-05-01',
  },
  {
    reviewer: 'Samuel Green',
    rating: 4,
    text: 'Tasty meals and friendly staff.',
    date: '2024-04-30',
  },
];

export default function ReviewsScreen() {
  const { colors } = useTheme();
  const { item } = useLocalSearchParams();
  const router = useRouter();
  const itemName = item
    ? item
        .toString()
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : 'item';
  const [selectedTab, setSelectedTab] = React.useState<number>(5);
  const tabs = [5, 4, 3, 2, 1];
  const filteredReviews = mockReviews.filter((r) => r.rating === selectedTab);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                {
                  backgroundColor:
                    selectedTab === tab ? colors.primary : colors.background,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  typography.body2,
                  {
                    color: selectedTab === tab ? '#fff' : colors.text,
                    fontWeight: selectedTab === tab ? 'bold' : 'normal',
                  },
                ]}
              >
                {tab} Star{tab > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ padding: 20 }}
      >
        <Text style={[typography.h2, { color: colors.text, marginBottom: 16 }]}>
          Reviews for {itemName}
        </Text>
        {filteredReviews.length === 0 ? (
          <View style={styles.placeholderBox}>
            <Text style={[typography.body1, { color: colors.textSecondary }]}>
              No {selectedTab}-star reviews yet.
            </Text>
          </View>
        ) : (
          filteredReviews.map((review, idx) => (
            <ReviewCard key={idx} {...review} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  placeholderBox: {
    marginTop: 40,
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  tabsScroll: {
    flexDirection: 'row',
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
});
