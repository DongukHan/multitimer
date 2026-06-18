import { View, Text } from 'react-native';
import AdBanner from '@/components/AdBanner';
export default function StopwatchScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>스톱워치</Text>
      <AdBanner />
    </View>
  );
}
