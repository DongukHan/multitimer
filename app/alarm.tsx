import { View, Text } from 'react-native';
import AdBanner from '@/components/AdBanner';
export default function AlarmScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>알람</Text>
      <AdBanner />
    </View>
  );
}
