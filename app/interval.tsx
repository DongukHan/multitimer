import { View, Text } from 'react-native';
import AdBanner from '@/components/AdBanner';
export default function IntervalScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>인터벌</Text>
      <AdBanner />
    </View>
  );
}
