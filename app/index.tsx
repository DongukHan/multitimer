import { View, Text } from 'react-native';
import AdBanner from '@/components/AdBanner';
export default function TimerScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>타이머</Text>
      <AdBanner />
    </View>
  );
}
