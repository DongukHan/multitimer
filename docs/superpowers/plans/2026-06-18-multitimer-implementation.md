# MultiTimer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Android 타이머/스톱워치/인터벌/알람 앱 (AdMob 수익화 포함) 을 처음부터 Play Store 출시 가능 수준으로 구현한다.

**Architecture:** 탭 4개(타이머·스톱워치·인터벌·알람)를 Bottom Navigation으로 연결. 타이머·인터벌은 Foreground Service로 백그라운드 실행, 알람은 AlarmManager exact alarm으로 트리거. Room DB로 프리셋·인터벌·알람 영속화.

**Tech Stack:** Kotlin, Jetpack Compose, Room, Hilt(DI), Foreground Service, AlarmManager, AdMob(배너)

## Global Constraints

- minSdk 26 (Android 8.0), targetSdk 34
- Kotlin 1.9+, Compose BOM 2024.05.00
- 패키지명: `com.multitimer`
- 프로젝트 루트: `C:\Users\dwhan\projects\multitimer`
- AdMob 테스트 App ID: `ca-app-pub-3940256099942544~3347511713` (실 출시 전 교체)
- 배너 테스트 Unit ID: `ca-app-pub-3940256099942544/6300978111`
- 모든 UI는 Material3 + Dark mode 지원

---

## File Structure

```
multitimer/
  app/
    build.gradle.kts
    src/main/
      AndroidManifest.xml
      java/com/multitimer/
        MainActivity.kt
        navigation/
          NavGraph.kt
        timer/
          TimerService.kt
          TimerViewModel.kt
          TimerScreen.kt
        stopwatch/
          StopwatchViewModel.kt
          StopwatchScreen.kt
        interval/
          IntervalService.kt
          IntervalViewModel.kt
          IntervalScreen.kt
        alarm/
          AlarmReceiver.kt
          BootReceiver.kt
          AlarmFullscreenActivity.kt
          AlarmViewModel.kt
          AlarmScreen.kt
        data/
          AppDatabase.kt
          TimerPreset.kt   (Entity + DAO)
          IntervalSession.kt + IntervalStep.kt + IntervalDao.kt
          Alarm.kt + AlarmDao.kt
        ui/
          theme/Theme.kt
          AdBanner.kt
        notifications/
          NotificationHelper.kt
        di/
          AppModule.kt
      res/
        values/strings.xml
        xml/file_paths.xml (불필요, 생략 가능)
  build.gradle.kts (project-level)
  settings.gradle.kts
```

---

### Task 1: 프로젝트 생성 및 의존성 설정

**Files:**
- Create: `app/build.gradle.kts`
- Create: `build.gradle.kts` (project)
- Create: `settings.gradle.kts`
- Create: `app/src/main/AndroidManifest.xml`

**Interfaces:**
- Produces: 빌드 가능한 빈 Compose 앱, Hilt 초기화

- [ ] **Step 1: Android Studio에서 새 프로젝트 생성**

  Android Studio → New Project → Empty Activity (Compose)
  - Name: MultiTimer
  - Package: `com.multitimer`
  - Save location: `C:\Users\dwhan\projects\multitimer`
  - Language: Kotlin
  - Min SDK: API 26

- [ ] **Step 2: app/build.gradle.kts 의존성 교체**

  파일 전체를 아래로 교체:

  ```kotlin
  plugins {
      alias(libs.plugins.android.application)
      alias(libs.plugins.kotlin.android)
      alias(libs.plugins.kotlin.compose)
      alias(libs.plugins.hilt)
      alias(libs.plugins.ksp)
  }

  android {
      namespace = "com.multitimer"
      compileSdk = 34

      defaultConfig {
          applicationId = "com.multitimer"
          minSdk = 26
          targetSdk = 34
          versionCode = 1
          versionName = "1.0"
      }

      buildTypes {
          release {
              isMinifyEnabled = true
              proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
          }
      }
      compileOptions {
          sourceCompatibility = JavaVersion.VERSION_17
          targetCompatibility = JavaVersion.VERSION_17
      }
      kotlinOptions { jvmTarget = "17" }
      buildFeatures { compose = true }
  }

  dependencies {
      val composeBom = platform("androidx.compose:compose-bom:2024.05.00")
      implementation(composeBom)
      implementation("androidx.compose.ui:ui")
      implementation("androidx.compose.material3:material3")
      implementation("androidx.compose.ui:ui-tooling-preview")
      implementation("androidx.activity:activity-compose:1.9.0")
      implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.0")
      implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.0")
      implementation("androidx.navigation:navigation-compose:2.7.7")

      // Hilt
      implementation("com.google.dagger:hilt-android:2.51.1")
      ksp("com.google.dagger:hilt-compiler:2.51.1")
      implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

      // Room
      implementation("androidx.room:room-runtime:2.6.1")
      implementation("androidx.room:room-ktx:2.6.1")
      ksp("androidx.room:room-compiler:2.6.1")

      // AdMob
      implementation("com.google.android.gms:play-services-ads:23.1.0")

      // DataStore (타이머 상태 복원용)
      implementation("androidx.datastore:datastore-preferences:1.1.1")

      debugImplementation("androidx.compose.ui:ui-tooling")
      testImplementation("junit:junit:4.13.2")
      testImplementation("androidx.room:room-testing:2.6.1")
      androidTestImplementation(composeBom)
      androidTestImplementation("androidx.compose.ui:ui-test-junit4")
  }
  ```

- [ ] **Step 3: libs.versions.toml 플러그인 추가**

  `gradle/libs.versions.toml`의 `[plugins]` 섹션에 추가:

  ```toml
  [versions]
  hilt = "2.51.1"
  ksp = "1.9.24-1.0.20"

  [plugins]
  hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
  ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
  ```

  project-level `build.gradle.kts`:

  ```kotlin
  plugins {
      alias(libs.plugins.android.application) apply false
      alias(libs.plugins.kotlin.android) apply false
      alias(libs.plugins.kotlin.compose) apply false
      alias(libs.plugins.hilt) apply false
      alias(libs.plugins.ksp) apply false
  }
  ```

- [ ] **Step 4: AndroidManifest.xml 권한 및 컴포넌트 선언**

  ```xml
  <?xml version="1.0" encoding="utf-8"?>
  <manifest xmlns:android="http://schemas.android.com/apk/res/android">

      <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
      <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
      <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
      <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
      <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
      <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
      <uses-permission android:name="android.permission.VIBRATE" />
      <uses-permission android:name="android.permission.INTERNET" />

      <application
          android:name=".MultiTimerApp"
          android:label="@string/app_name"
          android:theme="@style/Theme.MultiTimer"
          android:allowBackup="true">

          <activity
              android:name=".MainActivity"
              android:exported="true">
              <intent-filter>
                  <action android:name="android.intent.action.MAIN" />
                  <category android:name="android.intent.category.LAUNCHER" />
              </intent-filter>
          </activity>

          <activity
              android:name=".alarm.AlarmFullscreenActivity"
              android:exported="false"
              android:showOnLockScreen="true"
              android:turnScreenOn="true" />

          <service
              android:name=".timer.TimerService"
              android:foregroundServiceType="specialUse"
              android:exported="false" />

          <service
              android:name=".interval.IntervalService"
              android:foregroundServiceType="specialUse"
              android:exported="false" />

          <receiver
              android:name=".alarm.AlarmReceiver"
              android:exported="false" />

          <receiver
              android:name=".alarm.BootReceiver"
              android:exported="true">
              <intent-filter>
                  <action android:name="android.intent.action.BOOT_COMPLETED" />
              </intent-filter>
          </receiver>

          <meta-data
              android:name="com.google.android.gms.ads.APPLICATION_ID"
              android:value="ca-app-pub-3940256099942544~3347511713" />

      </application>
  </manifest>
  ```

- [ ] **Step 5: MultiTimerApp.kt 생성 (Hilt + AdMob 초기화)**

  `app/src/main/java/com/multitimer/MultiTimerApp.kt`:

  ```kotlin
  package com.multitimer

  import android.app.Application
  import com.google.android.gms.ads.MobileAds
  import dagger.hilt.android.HiltAndroidApp

  @HiltAndroidApp
  class MultiTimerApp : Application() {
      override fun onCreate() {
          super.onCreate()
          MobileAds.initialize(this)
      }
  }
  ```

- [ ] **Step 6: 빌드 확인**

  Android Studio → Build → Make Project  
  예상: BUILD SUCCESSFUL, 에러 없음

- [ ] **Step 7: 커밋**

  ```bash
  git init
  git add .
  git commit -m "chore: project setup with Compose, Hilt, Room, AdMob"
  ```

---

### Task 2: Room 데이터베이스 & 엔티티

**Files:**
- Create: `data/TimerPreset.kt`
- Create: `data/IntervalSession.kt`
- Create: `data/IntervalStep.kt`
- Create: `data/Alarm.kt`
- Create: `data/AppDatabase.kt`
- Create: `di/AppModule.kt`
- Test: `test/data/TimerPresetDaoTest.kt`

**Interfaces:**
- Produces:
  - `TimerPresetDao.getAll(): Flow<List<TimerPreset>>`
  - `TimerPresetDao.insert(preset: TimerPreset)`
  - `TimerPresetDao.delete(preset: TimerPreset)`
  - `IntervalDao.getSessions(): Flow<List<IntervalSessionWithSteps>>`
  - `AlarmDao.getAll(): Flow<List<Alarm>>`
  - `AlarmDao.upsert(alarm: Alarm): Long`
  - `AlarmDao.delete(alarm: Alarm)`

- [ ] **Step 1: TimerPreset 엔티티 + DAO 작성**

  `data/TimerPreset.kt`:

  ```kotlin
  package com.multitimer.data

  import androidx.room.*
  import kotlinx.coroutines.flow.Flow

  @Entity(tableName = "timer_presets")
  data class TimerPreset(
      @PrimaryKey(autoGenerate = true) val id: Long = 0,
      val label: String,
      val durationSeconds: Int
  )

  @Dao
  interface TimerPresetDao {
      @Query("SELECT * FROM timer_presets ORDER BY label ASC")
      fun getAll(): Flow<List<TimerPreset>>

      @Insert(onConflict = OnConflictStrategy.REPLACE)
      suspend fun insert(preset: TimerPreset)

      @Delete
      suspend fun delete(preset: TimerPreset)
  }
  ```

- [ ] **Step 2: IntervalSession + IntervalStep 엔티티 + DAO**

  `data/IntervalSession.kt`:

  ```kotlin
  package com.multitimer.data

  import androidx.room.*
  import kotlinx.coroutines.flow.Flow

  @Entity(tableName = "interval_sessions")
  data class IntervalSession(
      @PrimaryKey(autoGenerate = true) val id: Long = 0,
      val label: String,
      val repeatCount: Int = 1
  )

  @Entity(
      tableName = "interval_steps",
      foreignKeys = [ForeignKey(
          entity = IntervalSession::class,
          parentColumns = ["id"],
          childColumns = ["sessionId"],
          onDelete = ForeignKey.CASCADE
      )]
  )
  data class IntervalStep(
      @PrimaryKey(autoGenerate = true) val id: Long = 0,
      val sessionId: Long,
      val label: String,
      val durationSeconds: Int,
      val stepOrder: Int
  )

  data class IntervalSessionWithSteps(
      @Embedded val session: IntervalSession,
      @Relation(parentColumn = "id", entityColumn = "sessionId")
      val steps: List<IntervalStep>
  )

  @Dao
  interface IntervalDao {
      @Transaction
      @Query("SELECT * FROM interval_sessions")
      fun getSessions(): Flow<List<IntervalSessionWithSteps>>

      @Insert(onConflict = OnConflictStrategy.REPLACE)
      suspend fun insertSession(session: IntervalSession): Long

      @Insert(onConflict = OnConflictStrategy.REPLACE)
      suspend fun insertSteps(steps: List<IntervalStep>)

      @Delete
      suspend fun deleteSession(session: IntervalSession)

      @Query("DELETE FROM interval_steps WHERE sessionId = :sessionId")
      suspend fun deleteStepsForSession(sessionId: Long)
  }
  ```

- [ ] **Step 3: Alarm 엔티티 + DAO**

  `data/Alarm.kt`:

  ```kotlin
  package com.multitimer.data

  import androidx.room.*
  import kotlinx.coroutines.flow.Flow

  @Entity(tableName = "alarms")
  data class Alarm(
      @PrimaryKey(autoGenerate = true) val id: Long = 0,
      val label: String = "",
      val hour: Int,
      val minute: Int,
      val daysOfWeek: String = "",   // "1,3,5" 형식 (1=월 ~ 7=일), 빈 문자열=한 번만
      val isEnabled: Boolean = true,
      val ringtoneUri: String = ""   // 빈 문자열=기본 알람음
  )

  @Dao
  interface AlarmDao {
      @Query("SELECT * FROM alarms ORDER BY hour ASC, minute ASC")
      fun getAll(): Flow<List<Alarm>>

      @Query("SELECT * FROM alarms WHERE id = :id")
      suspend fun getById(id: Long): Alarm?

      @Insert(onConflict = OnConflictStrategy.REPLACE)
      suspend fun upsert(alarm: Alarm): Long

      @Delete
      suspend fun delete(alarm: Alarm)

      @Query("SELECT * FROM alarms WHERE isEnabled = 1")
      suspend fun getEnabled(): List<Alarm>
  }
  ```

- [ ] **Step 4: AppDatabase 작성**

  `data/AppDatabase.kt`:

  ```kotlin
  package com.multitimer.data

  import androidx.room.Database
  import androidx.room.RoomDatabase

  @Database(
      entities = [TimerPreset::class, IntervalSession::class, IntervalStep::class, Alarm::class],
      version = 1,
      exportSchema = false
  )
  abstract class AppDatabase : RoomDatabase() {
      abstract fun timerPresetDao(): TimerPresetDao
      abstract fun intervalDao(): IntervalDao
      abstract fun alarmDao(): AlarmDao
  }
  ```

- [ ] **Step 5: Hilt AppModule 작성**

  `di/AppModule.kt`:

  ```kotlin
  package com.multitimer.di

  import android.content.Context
  import androidx.room.Room
  import com.multitimer.data.*
  import dagger.Module
  import dagger.Provides
  import dagger.hilt.InstallIn
  import dagger.hilt.android.qualifiers.ApplicationContext
  import dagger.hilt.components.SingletonComponent
  import javax.inject.Singleton

  @Module
  @InstallIn(SingletonComponent::class)
  object AppModule {

      @Provides
      @Singleton
      fun provideDatabase(@ApplicationContext ctx: Context): AppDatabase =
          Room.databaseBuilder(ctx, AppDatabase::class.java, "multitimer.db").build()

      @Provides fun provideTimerPresetDao(db: AppDatabase): TimerPresetDao = db.timerPresetDao()
      @Provides fun provideIntervalDao(db: AppDatabase): IntervalDao = db.intervalDao()
      @Provides fun provideAlarmDao(db: AppDatabase): AlarmDao = db.alarmDao()
  }
  ```

- [ ] **Step 6: TimerPresetDao 단위 테스트 작성**

  `test/com/multitimer/data/TimerPresetDaoTest.kt`:

  ```kotlin
  package com.multitimer.data

  import android.content.Context
  import androidx.room.Room
  import androidx.test.core.app.ApplicationProvider
  import androidx.test.ext.junit.runners.AndroidJUnit4
  import kotlinx.coroutines.flow.first
  import kotlinx.coroutines.test.runTest
  import org.junit.After
  import org.junit.Assert.assertEquals
  import org.junit.Before
  import org.junit.Test
  import org.junit.runner.RunWith

  @RunWith(AndroidJUnit4::class)
  class TimerPresetDaoTest {
      private lateinit var db: AppDatabase
      private lateinit var dao: TimerPresetDao

      @Before
      fun setup() {
          val ctx = ApplicationProvider.getApplicationContext<Context>()
          db = Room.inMemoryDatabaseBuilder(ctx, AppDatabase::class.java).build()
          dao = db.timerPresetDao()
      }

      @After
      fun tearDown() = db.close()

      @Test
      fun insertAndGetPreset() = runTest {
          val preset = TimerPreset(label = "라면", durationSeconds = 180)
          dao.insert(preset)
          val list = dao.getAll().first()
          assertEquals(1, list.size)
          assertEquals("라면", list[0].label)
          assertEquals(180, list[0].durationSeconds)
      }

      @Test
      fun deletePreset() = runTest {
          val preset = TimerPreset(label = "운동", durationSeconds = 1800)
          dao.insert(preset)
          val inserted = dao.getAll().first()[0]
          dao.delete(inserted)
          val list = dao.getAll().first()
          assertEquals(0, list.size)
      }
  }
  ```

- [ ] **Step 7: 테스트 실행**

  Android Studio → Run 'TimerPresetDaoTest'  
  또는: `./gradlew connectedAndroidTest --tests "*.TimerPresetDaoTest"`  
  예상: 2 tests PASSED

- [ ] **Step 8: 커밋**

  ```bash
  git add app/src/
  git commit -m "feat: Room database with TimerPreset, Interval, Alarm entities"
  ```

---

### Task 3: Theme & 알림 채널 설정

**Files:**
- Create: `ui/theme/Theme.kt`
- Create: `notifications/NotificationHelper.kt`
- Modify: `res/values/strings.xml`

**Interfaces:**
- Produces:
  - `NotificationHelper.createChannels(context)` — 앱 시작 시 1회 호출
  - `CHANNEL_TIMER = "timer_channel"`
  - `CHANNEL_ALARM = "alarm_channel"`

- [ ] **Step 1: Theme.kt 작성**

  `ui/theme/Theme.kt`:

  ```kotlin
  package com.multitimer.ui.theme

  import android.app.Activity
  import android.os.Build
  import androidx.compose.foundation.isSystemInDarkTheme
  import androidx.compose.material3.*
  import androidx.compose.runtime.Composable
  import androidx.compose.runtime.SideEffect
  import androidx.compose.ui.graphics.toArgb
  import androidx.compose.ui.platform.LocalContext
  import androidx.compose.ui.platform.LocalView
  import androidx.core.view.WindowCompat

  @Composable
  fun MultiTimerTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
      val colorScheme = when {
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
              val context = LocalContext.current
              if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
          }
          darkTheme -> darkColorScheme()
          else -> lightColorScheme()
      }
      val view = LocalView.current
      if (!view.isInEditMode) {
          SideEffect {
              val window = (view.context as Activity).window
              window.statusBarColor = colorScheme.primary.toArgb()
              WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
          }
      }
      MaterialTheme(colorScheme = colorScheme, content = content)
  }
  ```

- [ ] **Step 2: NotificationHelper.kt 작성**

  `notifications/NotificationHelper.kt`:

  ```kotlin
  package com.multitimer.notifications

  import android.app.NotificationChannel
  import android.app.NotificationManager
  import android.content.Context
  import androidx.core.app.NotificationManagerCompat

  object NotificationHelper {
      const val CHANNEL_TIMER = "timer_channel"
      const val CHANNEL_ALARM = "alarm_channel"

      fun createChannels(context: Context) {
          val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
          manager.createNotificationChannel(
              NotificationChannel(CHANNEL_TIMER, "타이머", NotificationManager.IMPORTANCE_LOW).apply {
                  description = "실행 중인 타이머 알림"
              }
          )
          manager.createNotificationChannel(
              NotificationChannel(CHANNEL_ALARM, "알람", NotificationManager.IMPORTANCE_HIGH).apply {
                  description = "알람 트리거 알림"
              }
          )
      }
  }
  ```

- [ ] **Step 3: strings.xml 업데이트**

  `res/values/strings.xml`:

  ```xml
  <resources>
      <string name="app_name">MultiTimer</string>
      <string name="tab_timer">타이머</string>
      <string name="tab_stopwatch">스톱워치</string>
      <string name="tab_interval">인터벌</string>
      <string name="tab_alarm">알람</string>
  </resources>
  ```

- [ ] **Step 4: MainActivity.kt 작성**

  `MainActivity.kt`:

  ```kotlin
  package com.multitimer

  import android.Manifest
  import android.os.Build
  import android.os.Bundle
  import androidx.activity.ComponentActivity
  import androidx.activity.compose.setContent
  import androidx.activity.result.contract.ActivityResultContracts
  import com.multitimer.navigation.NavGraph
  import com.multitimer.notifications.NotificationHelper
  import com.multitimer.ui.theme.MultiTimerTheme
  import dagger.hilt.android.AndroidEntryPoint

  @AndroidEntryPoint
  class MainActivity : ComponentActivity() {

      private val notifPermission = registerForActivityResult(
          ActivityResultContracts.RequestPermission()
      ) { /* 허용 여부와 무관하게 앱 계속 실행 */ }

      override fun onCreate(savedInstanceState: Bundle?) {
          super.onCreate(savedInstanceState)
          NotificationHelper.createChannels(this)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
              notifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
          }
          setContent {
              MultiTimerTheme {
                  NavGraph()
              }
          }
      }
  }
  ```

- [ ] **Step 5: 커밋**

  ```bash
  git add app/src/
  git commit -m "feat: Material3 theme, notification channels, MainActivity"
  ```

---

### Task 4: AdMob 배너 컴포넌트 & Navigation Shell

**Files:**
- Create: `ui/AdBanner.kt`
- Create: `navigation/NavGraph.kt`

**Interfaces:**
- Produces:
  - `@Composable fun AdBanner()` — 각 탭 하단에 삽입
  - `@Composable fun NavGraph()` — 4탭 Bottom Navigation

- [ ] **Step 1: AdBanner 컴포저블 작성**

  `ui/AdBanner.kt`:

  ```kotlin
  package com.multitimer.ui

  import androidx.compose.runtime.Composable
  import androidx.compose.ui.viewinterop.AndroidView
  import com.google.android.gms.ads.AdRequest
  import com.google.android.gms.ads.AdSize
  import com.google.android.gms.ads.AdView

  @Composable
  fun AdBanner() {
      AndroidView(factory = { context ->
          AdView(context).apply {
              setAdSize(AdSize.BANNER)
              adUnitId = "ca-app-pub-3940256099942544/6300978111" // 테스트 ID
              loadAd(AdRequest.Builder().build())
          }
      })
  }
  ```

- [ ] **Step 2: NavGraph.kt 작성**

  `navigation/NavGraph.kt`:

  ```kotlin
  package com.multitimer.navigation

  import androidx.compose.foundation.layout.*
  import androidx.compose.material.icons.Icons
  import androidx.compose.material.icons.filled.*
  import androidx.compose.material3.*
  import androidx.compose.runtime.*
  import androidx.compose.ui.Modifier
  import androidx.navigation.NavDestination.Companion.hierarchy
  import androidx.navigation.NavGraph.Companion.findStartDestination
  import androidx.navigation.compose.*
  import com.multitimer.alarm.AlarmScreen
  import com.multitimer.interval.IntervalScreen
  import com.multitimer.stopwatch.StopwatchScreen
  import com.multitimer.timer.TimerScreen
  import com.multitimer.ui.AdBanner

  sealed class Screen(val route: String, val label: String) {
      object Timer : Screen("timer", "타이머")
      object Stopwatch : Screen("stopwatch", "스톱워치")
      object Interval : Screen("interval", "인터벌")
      object Alarm : Screen("alarm", "알람")
  }

  @Composable
  fun NavGraph() {
      val navController = rememberNavController()
      val items = listOf(Screen.Timer, Screen.Stopwatch, Screen.Interval, Screen.Alarm)
      val icons = listOf(Icons.Default.Timer, Icons.Default.Restore, Icons.Default.FitnessCenter, Icons.Default.Alarm)

      Scaffold(
          bottomBar = {
              Column {
                  AdBanner()
                  NavigationBar {
                      val currentBack by navController.currentBackStackEntryAsState()
                      val current = currentBack?.destination
                      items.forEachIndexed { i, screen ->
                          NavigationBarItem(
                              icon = { Icon(icons[i], contentDescription = screen.label) },
                              label = { Text(screen.label) },
                              selected = current?.hierarchy?.any { it.route == screen.route } == true,
                              onClick = {
                                  navController.navigate(screen.route) {
                                      popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                      launchSingleTop = true
                                      restoreState = true
                                  }
                              }
                          )
                      }
                  }
              }
          }
      ) { padding ->
          NavHost(navController, startDestination = Screen.Timer.route, Modifier.padding(padding)) {
              composable(Screen.Timer.route) { TimerScreen() }
              composable(Screen.Stopwatch.route) { StopwatchScreen() }
              composable(Screen.Interval.route) { IntervalScreen() }
              composable(Screen.Alarm.route) { AlarmScreen() }
          }
      }
  }
  ```

- [ ] **Step 3: 각 탭 화면 플레이스홀더 생성**

  다음 4개 파일 생성 (이후 Task에서 교체):

  `timer/TimerScreen.kt`:
  ```kotlin
  package com.multitimer.timer
  import androidx.compose.material3.Text
  import androidx.compose.runtime.Composable
  @Composable fun TimerScreen() { Text("타이머") }
  ```

  `stopwatch/StopwatchScreen.kt`:
  ```kotlin
  package com.multitimer.stopwatch
  import androidx.compose.material3.Text
  import androidx.compose.runtime.Composable
  @Composable fun StopwatchScreen() { Text("스톱워치") }
  ```

  `interval/IntervalScreen.kt`:
  ```kotlin
  package com.multitimer.interval
  import androidx.compose.material3.Text
  import androidx.compose.runtime.Composable
  @Composable fun IntervalScreen() { Text("인터벌") }
  ```

  `alarm/AlarmScreen.kt`:
  ```kotlin
  package com.multitimer.alarm
  import androidx.compose.material3.Text
  import androidx.compose.runtime.Composable
  @Composable fun AlarmScreen() { Text("알람") }
  ```

- [ ] **Step 4: 빌드 & 에뮬레이터 실행**

  에뮬레이터(API 26+)에서 실행 → 하단 탭 4개 + 배너 광고 확인  
  예상: 탭 전환 동작, 배너 자리에 테스트 광고 표시

- [ ] **Step 5: 커밋**

  ```bash
  git add app/src/
  git commit -m "feat: bottom navigation shell with AdMob banner"
  ```

---

### Task 5: 타이머 — Foreground Service & ViewModel

**Files:**
- Create: `timer/TimerService.kt`
- Create: `timer/TimerViewModel.kt`

**Interfaces:**
- Produces:
  - `TimerService`: Intent action `ACTION_START`, `ACTION_PAUSE`, `ACTION_RESET` (extra: `EXTRA_TIMER_ID`, `EXTRA_DURATION`)
  - `TimerViewModel.timers: StateFlow<List<TimerState>>`
  - `TimerViewModel.addTimer(label: String, durationSeconds: Int)`
  - `TimerViewModel.startTimer(id: String)`
  - `TimerViewModel.pauseTimer(id: String)`
  - `TimerViewModel.resetTimer(id: String)`

- [ ] **Step 1: TimerState 데이터 클래스 정의**

  `timer/TimerService.kt` 상단에:

  ```kotlin
  package com.multitimer.timer

  import android.app.*
  import android.content.Intent
  import android.os.*
  import androidx.core.app.NotificationCompat
  import com.multitimer.MainActivity
  import com.multitimer.notifications.NotificationHelper
  import kotlinx.coroutines.*
  import kotlinx.coroutines.flow.MutableStateFlow
  import kotlinx.coroutines.flow.StateFlow

  data class TimerState(
      val id: String,
      val label: String,
      val totalSeconds: Int,
      val remainingSeconds: Int,
      val isRunning: Boolean
  ) {
      val isFinished: Boolean get() = remainingSeconds <= 0
  }
  ```

- [ ] **Step 2: TimerService 구현**

  ```kotlin
  class TimerService : Service() {
      companion object {
          const val ACTION_START = "START"
          const val ACTION_PAUSE = "PAUSE"
          const val ACTION_RESET = "RESET"
          const val ACTION_REMOVE = "REMOVE"
          const val EXTRA_TIMER_ID = "timer_id"
          const val EXTRA_DURATION = "duration"
          const val EXTRA_LABEL = "label"

          private val _timers = MutableStateFlow<Map<String, TimerState>>(emptyMap())
          val timers: StateFlow<Map<String, TimerState>> = _timers
      }

      private val serviceScope = CoroutineScope(Dispatchers.Default + Job())
      private val jobs = mutableMapOf<String, Job>()
      private val binder = LocalBinder()

      inner class LocalBinder : Binder() {
          fun getService(): TimerService = this@TimerService
      }

      override fun onBind(intent: Intent?): IBinder = binder

      override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
          val id = intent?.getStringExtra(EXTRA_TIMER_ID) ?: return START_NOT_STICKY
          when (intent.action) {
              ACTION_START -> startTimer(
                  id,
                  intent.getStringExtra(EXTRA_LABEL) ?: "",
                  intent.getIntExtra(EXTRA_DURATION, 0)
              )
              ACTION_PAUSE -> pauseTimer(id)
              ACTION_RESET -> resetTimer(id)
              ACTION_REMOVE -> removeTimer(id)
          }
          return START_NOT_STICKY
      }

      private fun startTimer(id: String, label: String, durationSeconds: Int) {
          val existing = _timers.value[id]
          val state = existing ?: TimerState(id, label, durationSeconds, durationSeconds, false)
          _timers.value = _timers.value + (id to state.copy(isRunning = true))

          jobs[id]?.cancel()
          jobs[id] = serviceScope.launch {
              while (true) {
                  delay(1000)
                  val current = _timers.value[id] ?: break
                  if (!current.isRunning) break
                  val next = current.copy(remainingSeconds = current.remainingSeconds - 1)
                  _timers.value = _timers.value + (id to next)
                  if (next.isFinished) {
                      onTimerFinished(next)
                      break
                  }
              }
              updateForeground()
          }
          startForeground(1, buildNotification())
      }

      private fun pauseTimer(id: String) {
          jobs[id]?.cancel()
          _timers.value = _timers.value[id]?.let { state ->
              _timers.value + (id to state.copy(isRunning = false))
          } ?: _timers.value
          updateForeground()
      }

      private fun resetTimer(id: String) {
          jobs[id]?.cancel()
          _timers.value = _timers.value[id]?.let { state ->
              _timers.value + (id to state.copy(remainingSeconds = state.totalSeconds, isRunning = false))
          } ?: _timers.value
          updateForeground()
      }

      private fun removeTimer(id: String) {
          jobs[id]?.cancel()
          jobs.remove(id)
          _timers.value = _timers.value - id
          if (_timers.value.isEmpty()) stopSelf()
          else updateForeground()
      }

      private fun onTimerFinished(state: TimerState) {
          _timers.value = _timers.value + (state.id to state.copy(isRunning = false))
          val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
          val notification = NotificationCompat.Builder(this, NotificationHelper.CHANNEL_ALARM)
              .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
              .setContentTitle("타이머 완료")
              .setContentText("${state.label} 완료!")
              .setAutoCancel(true)
              .build()
          manager.notify(state.id.hashCode(), notification)
      }

      private fun buildNotification(): Notification {
          val intent = Intent(this, MainActivity::class.java)
          val pi = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE)
          val running = _timers.value.values.filter { it.isRunning }
          val text = if (running.isEmpty()) "일시정지" else running.joinToString { it.label }
          return NotificationCompat.Builder(this, NotificationHelper.CHANNEL_TIMER)
              .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
              .setContentTitle("타이머 실행 중")
              .setContentText(text)
              .setContentIntent(pi)
              .setOngoing(true)
              .build()
      }

      private fun updateForeground() {
          val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
          manager.notify(1, buildNotification())
      }

      override fun onDestroy() {
          serviceScope.cancel()
          super.onDestroy()
      }
  }
  ```

- [ ] **Step 3: TimerViewModel 작성**

  `timer/TimerViewModel.kt`:

  ```kotlin
  package com.multitimer.timer

  import android.app.Application
  import android.content.Intent
  import androidx.lifecycle.AndroidViewModel
  import com.multitimer.data.TimerPreset
  import com.multitimer.data.TimerPresetDao
  import dagger.hilt.android.lifecycle.HiltViewModel
  import kotlinx.coroutines.CoroutineScope
  import kotlinx.coroutines.Dispatchers
  import kotlinx.coroutines.flow.SharingStarted
  import kotlinx.coroutines.flow.StateFlow
  import kotlinx.coroutines.flow.map
  import kotlinx.coroutines.flow.stateIn
  import kotlinx.coroutines.launch
  import java.util.UUID
  import javax.inject.Inject

  @HiltViewModel
  class TimerViewModel @Inject constructor(
      app: Application,
      private val presetDao: TimerPresetDao
  ) : AndroidViewModel(app) {

      private val context get() = getApplication<Application>()
      private val scope = CoroutineScope(Dispatchers.IO)

      val timers: StateFlow<List<TimerState>> = TimerService.timers
          .map { it.values.toList() }
          .stateIn(scope, SharingStarted.Eagerly, emptyList())

      val presets = presetDao.getAll().stateIn(scope, SharingStarted.Eagerly, emptyList())

      fun addTimer(label: String, durationSeconds: Int) {
          val id = UUID.randomUUID().toString()
          val intent = Intent(context, TimerService::class.java).apply {
              action = TimerService.ACTION_START
              putExtra(TimerService.EXTRA_TIMER_ID, id)
              putExtra(TimerService.EXTRA_LABEL, label)
              putExtra(TimerService.EXTRA_DURATION, durationSeconds)
          }
          context.startForegroundService(intent)
      }

      fun start(id: String) = sendAction(TimerService.ACTION_START, id)
      fun pause(id: String) = sendAction(TimerService.ACTION_PAUSE, id)
      fun reset(id: String) = sendAction(TimerService.ACTION_RESET, id)
      fun remove(id: String) = sendAction(TimerService.ACTION_REMOVE, id)

      fun savePreset(label: String, durationSeconds: Int) {
          scope.launch { presetDao.insert(TimerPreset(label = label, durationSeconds = durationSeconds)) }
      }

      fun deletePreset(preset: TimerPreset) {
          scope.launch { presetDao.delete(preset) }
      }

      private fun sendAction(action: String, id: String) {
          val intent = Intent(context, TimerService::class.java).apply {
              this.action = action
              putExtra(TimerService.EXTRA_TIMER_ID, id)
          }
          context.startService(intent)
      }
  }
  ```

- [ ] **Step 4: 커밋**

  ```bash
  git add app/src/
  git commit -m "feat: TimerService (Foreground) and TimerViewModel"
  ```

---

### Task 6: 타이머 UI

**Files:**
- Modify: `timer/TimerScreen.kt` (플레이스홀더 교체)

**Interfaces:**
- Consumes: `TimerViewModel.timers`, `TimerViewModel.presets`, `TimerViewModel.addTimer()`, `.start()`, `.pause()`, `.reset()`, `.remove()`, `.savePreset()`

- [ ] **Step 1: TimerScreen.kt 전체 작성**

  ```kotlin
  package com.multitimer.timer

  import androidx.compose.foundation.layout.*
  import androidx.compose.foundation.lazy.LazyColumn
  import androidx.compose.foundation.lazy.items
  import androidx.compose.material.icons.Icons
  import androidx.compose.material.icons.filled.*
  import androidx.compose.material3.*
  import androidx.compose.runtime.*
  import androidx.compose.ui.Alignment
  import androidx.compose.ui.Modifier
  import androidx.compose.ui.unit.dp
  import androidx.compose.ui.unit.sp
  import androidx.hilt.navigation.compose.hiltViewModel
  import com.multitimer.data.TimerPreset

  @Composable
  fun TimerScreen(vm: TimerViewModel = hiltViewModel()) {
      val timers by vm.timers.collectAsState()
      val presets by vm.presets.collectAsState()
      var showAddDialog by remember { mutableStateOf(false) }
      var showPresetsDialog by remember { mutableStateOf(false) }

      Scaffold(
          floatingActionButton = {
              FloatingActionButton(onClick = { showAddDialog = true }) {
                  Icon(Icons.Default.Add, "타이머 추가")
              }
          }
      ) { padding ->
          LazyColumn(Modifier.padding(padding).fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
              items(timers, key = { it.id }) { state ->
                  TimerCard(state, vm)
                  Spacer(Modifier.height(12.dp))
              }
          }
      }

      if (showAddDialog) {
          AddTimerDialog(
              presets = presets,
              onAdd = { label, seconds -> vm.addTimer(label, seconds) },
              onSavePreset = { label, seconds -> vm.savePreset(label, seconds) },
              onDeletePreset = { vm.deletePreset(it) },
              onDismiss = { showAddDialog = false }
          )
      }
  }

  @Composable
  fun TimerCard(state: TimerState, vm: TimerViewModel) {
      val h = state.remainingSeconds / 3600
      val m = (state.remainingSeconds % 3600) / 60
      val s = state.remainingSeconds % 60
      val timeText = if (h > 0) "%02d:%02d:%02d".format(h, m, s) else "%02d:%02d".format(m, s)
      val progress = if (state.totalSeconds > 0) state.remainingSeconds.toFloat() / state.totalSeconds else 0f

      Card(Modifier.fillMaxWidth()) {
          Column(Modifier.padding(16.dp)) {
              Row(verticalAlignment = Alignment.CenterVertically) {
                  Text(state.label, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                  IconButton(onClick = { vm.remove(state.id) }) {
                      Icon(Icons.Default.Close, "삭제")
                  }
              }
              Spacer(Modifier.height(8.dp))
              LinearProgressIndicator(progress = { progress }, modifier = Modifier.fillMaxWidth())
              Spacer(Modifier.height(8.dp))
              Text(timeText, fontSize = 40.sp, modifier = Modifier.align(Alignment.CenterHorizontally))
              Spacer(Modifier.height(8.dp))
              Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                  IconButton(onClick = { vm.reset(state.id) }) { Icon(Icons.Default.Refresh, "리셋") }
                  if (state.isRunning) {
                      IconButton(onClick = { vm.pause(state.id) }) { Icon(Icons.Default.Pause, "정지") }
                  } else {
                      IconButton(onClick = { vm.start(state.id) }) { Icon(Icons.Default.PlayArrow, "시작") }
                  }
              }
          }
      }
  }

  @Composable
  fun AddTimerDialog(
      presets: List<TimerPreset>,
      onAdd: (String, Int) -> Unit,
      onSavePreset: (String, Int) -> Unit,
      onDeletePreset: (TimerPreset) -> Unit,
      onDismiss: () -> Unit
  ) {
      var label by remember { mutableStateOf("") }
      var hours by remember { mutableStateOf("0") }
      var minutes by remember { mutableStateOf("0") }
      var seconds by remember { mutableStateOf("0") }

      AlertDialog(
          onDismissRequest = onDismiss,
          title = { Text("타이머 추가") },
          text = {
              Column {
                  OutlinedTextField(value = label, onValueChange = { label = it }, label = { Text("이름") })
                  Spacer(Modifier.height(8.dp))
                  Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                      OutlinedTextField(value = hours, onValueChange = { hours = it }, label = { Text("시") }, modifier = Modifier.weight(1f))
                      OutlinedTextField(value = minutes, onValueChange = { minutes = it }, label = { Text("분") }, modifier = Modifier.weight(1f))
                      OutlinedTextField(value = seconds, onValueChange = { seconds = it }, label = { Text("초") }, modifier = Modifier.weight(1f))
                  }
                  if (presets.isNotEmpty()) {
                      Spacer(Modifier.height(12.dp))
                      Text("프리셋", style = MaterialTheme.typography.labelMedium)
                      presets.forEach { preset ->
                          Row(verticalAlignment = Alignment.CenterVertically) {
                              TextButton(onClick = {
                                  label = preset.label
                                  hours = (preset.durationSeconds / 3600).toString()
                                  minutes = ((preset.durationSeconds % 3600) / 60).toString()
                                  seconds = (preset.durationSeconds % 60).toString()
                              }, modifier = Modifier.weight(1f)) { Text(preset.label) }
                              IconButton(onClick = { onDeletePreset(preset) }) {
                                  Icon(Icons.Default.Delete, "삭제", modifier = Modifier.size(16.dp))
                              }
                          }
                      }
                  }
              }
          },
          confirmButton = {
              Column {
                  TextButton(onClick = {
                      val total = (hours.toIntOrNull() ?: 0) * 3600 +
                              (minutes.toIntOrNull() ?: 0) * 60 +
                              (seconds.toIntOrNull() ?: 0)
                      if (total > 0) {
                          onSavePreset(label.ifBlank { "타이머" }, total)
                      }
                  }) { Text("프리셋 저장") }
                  Button(onClick = {
                      val total = (hours.toIntOrNull() ?: 0) * 3600 +
                              (minutes.toIntOrNull() ?: 0) * 60 +
                              (seconds.toIntOrNull() ?: 0)
                      if (total > 0) { onAdd(label.ifBlank { "타이머" }, total); onDismiss() }
                  }) { Text("시작") }
              }
          },
          dismissButton = { TextButton(onClick = onDismiss) { Text("취소") } }
      )
  }
  ```

- [ ] **Step 2: 에뮬레이터에서 동작 확인**

  - FAB → 타이머 추가 → 시작/정지/리셋
  - 프리셋 저장 → 다시 불러오기
  - 앱 백그라운드 이동 후 알림 확인

- [ ] **Step 3: 커밋**

  ```bash
  git add app/src/
  git commit -m "feat: timer tab UI with multiple timers and presets"
  ```

---

### Task 7: 스톱워치

**Files:**
- Create: `stopwatch/StopwatchViewModel.kt`
- Modify: `stopwatch/StopwatchScreen.kt`

**Interfaces:**
- Produces:
  - `StopwatchViewModel.elapsed: StateFlow<Long>` (밀리초)
  - `StopwatchViewModel.laps: StateFlow<List<Long>>`
  - `StopwatchViewModel.isRunning: StateFlow<Boolean>`
  - `.start()`, `.stop()`, `.lap()`, `.reset()`

- [ ] **Step 1: StopwatchViewModel 작성**

  ```kotlin
  package com.multitimer.stopwatch

  import androidx.lifecycle.ViewModel
  import androidx.lifecycle.viewModelScope
  import dagger.hilt.android.lifecycle.HiltViewModel
  import kotlinx.coroutines.*
  import kotlinx.coroutines.flow.*
  import javax.inject.Inject

  @HiltViewModel
  class StopwatchViewModel @Inject constructor() : ViewModel() {
      private val _elapsed = MutableStateFlow(0L)
      val elapsed: StateFlow<Long> = _elapsed

      private val _laps = MutableStateFlow<List<Long>>(emptyList())
      val laps: StateFlow<List<Long>> = _laps

      private val _isRunning = MutableStateFlow(false)
      val isRunning: StateFlow<Boolean> = _isRunning

      private var job: Job? = null
      private var startTime = 0L
      private var baseElapsed = 0L

      fun start() {
          if (_isRunning.value) return
          _isRunning.value = true
          startTime = System.currentTimeMillis()
          job = viewModelScope.launch {
              while (isActive) {
                  _elapsed.value = baseElapsed + (System.currentTimeMillis() - startTime)
                  delay(10)
              }
          }
      }

      fun stop() {
          _isRunning.value = false
          baseElapsed = _elapsed.value
          job?.cancel()
      }

      fun lap() {
          if (!_isRunning.value) return
          _laps.value = listOf(_elapsed.value) + _laps.value
      }

      fun reset() {
          job?.cancel()
          _isRunning.value = false
          _elapsed.value = 0L
          _laps.value = emptyList()
          baseElapsed = 0L
      }
  }
  ```

- [ ] **Step 2: StopwatchScreen 작성**

  ```kotlin
  package com.multitimer.stopwatch

  import androidx.compose.foundation.layout.*
  import androidx.compose.foundation.lazy.LazyColumn
  import androidx.compose.foundation.lazy.itemsIndexed
  import androidx.compose.material.icons.Icons
  import androidx.compose.material.icons.filled.*
  import androidx.compose.material3.*
  import androidx.compose.runtime.*
  import androidx.compose.ui.Alignment
  import androidx.compose.ui.Modifier
  import androidx.compose.ui.unit.dp
  import androidx.compose.ui.unit.sp
  import androidx.hilt.navigation.compose.hiltViewModel

  @Composable
  fun StopwatchScreen(vm: StopwatchViewModel = hiltViewModel()) {
      val elapsed by vm.elapsed.collectAsState()
      val laps by vm.laps.collectAsState()
      val isRunning by vm.isRunning.collectAsState()

      Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
          Spacer(Modifier.height(32.dp))
          Text(formatElapsed(elapsed), fontSize = 56.sp)
          Spacer(Modifier.height(32.dp))
          Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
              OutlinedButton(onClick = { if (isRunning) vm.lap() else vm.reset() }) {
                  Text(if (isRunning) "랩" else "리셋")
              }
              Button(onClick = { if (isRunning) vm.stop() else vm.start() }, modifier = Modifier.size(72.dp)) {
                  Icon(if (isRunning) Icons.Default.Pause else Icons.Default.PlayArrow, null)
              }
          }
          Spacer(Modifier.height(24.dp))
          LazyColumn(Modifier.fillMaxWidth()) {
              itemsIndexed(laps) { i, lap ->
                  Row(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                      Text("랩 ${laps.size - i}", Modifier.weight(1f))
                      Text(formatElapsed(lap))
                  }
                  HorizontalDivider()
              }
          }
      }
  }

  fun formatElapsed(ms: Long): String {
      val min = ms / 60000
      val sec = (ms % 60000) / 1000
      val cent = (ms % 1000) / 10
      return "%02d:%02d.%02d".format(min, sec, cent)
  }
  ```

- [ ] **Step 3: 에뮬레이터에서 확인**

  스톱워치 탭 → 시작 → 랩 여러 번 → 정지 → 리셋

- [ ] **Step 4: 커밋**

  ```bash
  git add app/src/
  git commit -m "feat: stopwatch with lap tracking"
  ```

---

### Task 8: 인터벌 타이머

**Files:**
- Create: `interval/IntervalService.kt`
- Create: `interval/IntervalViewModel.kt`
- Modify: `interval/IntervalScreen.kt`

**Interfaces:**
- Produces:
  - `IntervalViewModel.sessions: StateFlow<List<IntervalSessionWithSteps>>`
  - `IntervalViewModel.runningState: StateFlow<IntervalRunState?>`
  - `.startSession(session: IntervalSessionWithSteps)`
  - `.pause()`, `.resume()`, `.stop()`
  - `.saveSession(label, steps, repeatCount)`
  - `.deleteSession(session)`

- [ ] **Step 1: IntervalRunState 정의 & IntervalService 작성**

  `interval/IntervalService.kt`:

  ```kotlin
  package com.multitimer.interval

  import android.app.*
  import android.content.Intent
  import android.os.*
  import androidx.core.app.NotificationCompat
  import com.multitimer.MainActivity
  import com.multitimer.data.IntervalSessionWithSteps
  import com.multitimer.data.IntervalStep
  import com.multitimer.notifications.NotificationHelper
  import kotlinx.coroutines.*
  import kotlinx.coroutines.flow.MutableStateFlow
  import kotlinx.coroutines.flow.StateFlow

  data class IntervalRunState(
      val sessionLabel: String,
      val currentStep: IntervalStep,
      val stepIndex: Int,
      val totalSteps: Int,
      val currentRepeat: Int,
      val totalRepeats: Int,
      val remainingSeconds: Int,
      val isRunning: Boolean
  )

  class IntervalService : Service() {
      companion object {
          const val ACTION_START = "INTERVAL_START"
          const val ACTION_PAUSE = "INTERVAL_PAUSE"
          const val ACTION_STOP = "INTERVAL_STOP"

          private val _state = MutableStateFlow<IntervalRunState?>(null)
          val state: StateFlow<IntervalRunState?> = _state
          var pendingSession: IntervalSessionWithSteps? = null
      }

      private val serviceScope = CoroutineScope(Dispatchers.Default + Job())
      private var timerJob: Job? = null
      private val binder = LocalBinder()

      inner class LocalBinder : Binder() { fun getService() = this@IntervalService }
      override fun onBind(intent: Intent?) = binder

      override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
          when (intent?.action) {
              ACTION_START -> pendingSession?.let { startInterval(it) }
              ACTION_PAUSE -> togglePause()
              ACTION_STOP -> { stopSelf(); _state.value = null }
          }
          return START_NOT_STICKY
      }

      private fun startInterval(session: IntervalSessionWithSteps) {
          val steps = session.steps.sortedBy { it.stepOrder }
          if (steps.isEmpty()) return
          _state.value = IntervalRunState(
              sessionLabel = session.session.label,
              currentStep = steps[0],
              stepIndex = 0,
              totalSteps = steps.size,
              currentRepeat = 1,
              totalRepeats = session.session.repeatCount,
              remainingSeconds = steps[0].durationSeconds,
              isRunning = true
          )
          startForeground(2, buildNotification())
          tick(session, steps)
      }

      private fun tick(session: IntervalSessionWithSteps, steps: List<IntervalStep>) {
          timerJob?.cancel()
          timerJob = serviceScope.launch {
              while (true) {
                  delay(1000)
                  val cur = _state.value ?: break
                  if (!cur.isRunning) continue
                  if (cur.remainingSeconds > 1) {
                      _state.value = cur.copy(remainingSeconds = cur.remainingSeconds - 1)
                  } else {
                      // 다음 스텝으로
                      val nextStepIdx = cur.stepIndex + 1
                      if (nextStepIdx < steps.size) {
                          _state.value = cur.copy(
                              currentStep = steps[nextStepIdx],
                              stepIndex = nextStepIdx,
                              remainingSeconds = steps[nextStepIdx].durationSeconds
                          )
                      } else if (cur.currentRepeat < cur.totalRepeats) {
                          _state.value = cur.copy(
                              currentStep = steps[0],
                              stepIndex = 0,
                              currentRepeat = cur.currentRepeat + 1,
                              remainingSeconds = steps[0].durationSeconds
                          )
                      } else {
                          _state.value = cur.copy(isRunning = false, remainingSeconds = 0)
                          notifyFinished(session.session.label)
                          stopSelf()
                          break
                      }
                  }
                  updateForeground()
              }
          }
      }

      private fun togglePause() {
          _state.value = _state.value?.let { it.copy(isRunning = !it.isRunning) }
      }

      private fun buildNotification(): Notification {
          val pi = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
          val s = _state.value
          return NotificationCompat.Builder(this, NotificationHelper.CHANNEL_TIMER)
              .setSmallIcon(android.R.drawable.ic_media_play)
              .setContentTitle(s?.sessionLabel ?: "인터벌")
              .setContentText(s?.let { "${it.currentStep.label} ${it.remainingSeconds}초" } ?: "")
              .setContentIntent(pi)
              .setOngoing(true)
              .build()
      }

      private fun updateForeground() {
          (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(2, buildNotification())
      }

      private fun notifyFinished(label: String) {
          val n = NotificationCompat.Builder(this, NotificationHelper.CHANNEL_ALARM)
              .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
              .setContentTitle("인터벌 완료")
              .setContentText("$label 완료!")
              .setAutoCancel(true)
              .build()
          (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(3, n)
      }

      override fun onDestroy() { serviceScope.cancel(); super.onDestroy() }
  }
  ```

- [ ] **Step 2: IntervalViewModel 작성**

  `interval/IntervalViewModel.kt`:

  ```kotlin
  package com.multitimer.interval

  import android.app.Application
  import android.content.Intent
  import androidx.lifecycle.AndroidViewModel
  import com.multitimer.data.*
  import dagger.hilt.android.lifecycle.HiltViewModel
  import kotlinx.coroutines.*
  import kotlinx.coroutines.flow.*
  import javax.inject.Inject

  @HiltViewModel
  class IntervalViewModel @Inject constructor(
      app: Application,
      private val dao: IntervalDao
  ) : AndroidViewModel(app) {
      private val context get() = getApplication<Application>()
      private val scope = CoroutineScope(Dispatchers.IO)

      val sessions = dao.getSessions().stateIn(scope, SharingStarted.Eagerly, emptyList())
      val runningState = IntervalService.state

      fun startSession(session: IntervalSessionWithSteps) {
          IntervalService.pendingSession = session
          val intent = Intent(context, IntervalService::class.java).apply { action = IntervalService.ACTION_START }
          context.startForegroundService(intent)
      }

      fun pause() = context.startService(Intent(context, IntervalService::class.java).apply { action = IntervalService.ACTION_PAUSE })
      fun stop() = context.startService(Intent(context, IntervalService::class.java).apply { action = IntervalService.ACTION_STOP })

      fun saveSession(label: String, steps: List<Pair<String, Int>>, repeatCount: Int) {
          scope.launch {
              val id = dao.insertSession(IntervalSession(label = label, repeatCount = repeatCount))
              val stepEntities = steps.mapIndexed { i, (stepLabel, seconds) ->
                  IntervalStep(sessionId = id, label = stepLabel, durationSeconds = seconds, stepOrder = i)
              }
              dao.insertSteps(stepEntities)
          }
      }

      fun deleteSession(session: IntervalSession) {
          scope.launch { dao.deleteSession(session) }
      }
  }
  ```

- [ ] **Step 3: IntervalScreen 작성**

  `interval/IntervalScreen.kt`:

  ```kotlin
  package com.multitimer.interval

  import androidx.compose.foundation.layout.*
  import androidx.compose.foundation.lazy.LazyColumn
  import androidx.compose.foundation.lazy.items
  import androidx.compose.material.icons.Icons
  import androidx.compose.material.icons.filled.*
  import androidx.compose.material3.*
  import androidx.compose.runtime.*
  import androidx.compose.ui.Alignment
  import androidx.compose.ui.Modifier
  import androidx.compose.ui.unit.dp
  import androidx.compose.ui.unit.sp
  import androidx.hilt.navigation.compose.hiltViewModel
  import com.multitimer.data.IntervalSessionWithSteps

  @Composable
  fun IntervalScreen(vm: IntervalViewModel = hiltViewModel()) {
      val sessions by vm.sessions.collectAsState()
      val running by vm.runningState.collectAsState()
      var showAdd by remember { mutableStateOf(false) }

      if (running != null) {
          IntervalRunView(state = running!!, onPause = vm::pause, onStop = vm::stop)
          return
      }

      Scaffold(
          floatingActionButton = {
              FloatingActionButton(onClick = { showAdd = true }) { Icon(Icons.Default.Add, "세션 추가") }
          }
      ) { padding ->
          LazyColumn(Modifier.padding(padding).fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
              items(sessions, key = { it.session.id }) { session ->
                  SessionCard(session, onStart = { vm.startSession(session) }, onDelete = { vm.deleteSession(session.session) })
                  Spacer(Modifier.height(12.dp))
              }
          }
      }

      if (showAdd) AddSessionDialog(onSave = { label, steps, repeat -> vm.saveSession(label, steps, repeat) }, onDismiss = { showAdd = false })
  }

  @Composable
  fun IntervalRunView(state: IntervalRunState, onPause: () -> Unit, onStop: () -> Unit) {
      Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
          Spacer(Modifier.height(32.dp))
          Text(state.sessionLabel, style = MaterialTheme.typography.headlineSmall)
          Text("반복 ${state.currentRepeat}/${state.totalRepeats} · 구간 ${state.stepIndex + 1}/${state.totalSteps}")
          Spacer(Modifier.height(24.dp))
          Text(state.currentStep.label, style = MaterialTheme.typography.titleLarge)
          Text("${state.remainingSeconds}초", fontSize = 64.sp)
          Spacer(Modifier.height(32.dp))
          Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
              OutlinedButton(onClick = onStop) { Text("중지") }
              Button(onClick = onPause) { Text(if (state.isRunning) "일시정지" else "계속") }
          }
      }
  }

  @Composable
  fun SessionCard(session: IntervalSessionWithSteps, onStart: () -> Unit, onDelete: () -> Unit) {
      Card(Modifier.fillMaxWidth()) {
          Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
              Column(Modifier.weight(1f)) {
                  Text(session.session.label, style = MaterialTheme.typography.titleMedium)
                  Text("${session.steps.size}구간 · ${session.session.repeatCount}회 반복", style = MaterialTheme.typography.bodySmall)
              }
              IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, "삭제") }
              Button(onClick = onStart) { Text("시작") }
          }
      }
  }

  @Composable
  fun AddSessionDialog(onSave: (String, List<Pair<String, Int>>, Int) -> Unit, onDismiss: () -> Unit) {
      var label by remember { mutableStateOf("") }
      var repeatCount by remember { mutableStateOf("1") }
      val steps = remember { mutableStateListOf<Pair<String, Int>>() }
      var stepLabel by remember { mutableStateOf("") }
      var stepSeconds by remember { mutableStateOf("") }

      AlertDialog(
          onDismissRequest = onDismiss,
          title = { Text("인터벌 세션 추가") },
          text = {
              Column {
                  OutlinedTextField(value = label, onValueChange = { label = it }, label = { Text("세션 이름") })
                  OutlinedTextField(value = repeatCount, onValueChange = { repeatCount = it }, label = { Text("반복 횟수") })
                  Spacer(Modifier.height(8.dp))
                  Text("구간 목록", style = MaterialTheme.typography.labelMedium)
                  steps.forEachIndexed { i, (sl, ss) ->
                      Row(verticalAlignment = Alignment.CenterVertically) {
                          Text("$sl ${ss}초", Modifier.weight(1f))
                          IconButton(onClick = { steps.removeAt(i) }) { Icon(Icons.Default.Remove, "삭제", Modifier.size(16.dp)) }
                      }
                  }
                  Row(verticalAlignment = Alignment.CenterVertically) {
                      OutlinedTextField(value = stepLabel, onValueChange = { stepLabel = it }, label = { Text("구간명") }, modifier = Modifier.weight(1f))
                      Spacer(Modifier.width(4.dp))
                      OutlinedTextField(value = stepSeconds, onValueChange = { stepSeconds = it }, label = { Text("초") }, modifier = Modifier.width(64.dp))
                      IconButton(onClick = {
                          val s = stepSeconds.toIntOrNull() ?: return@IconButton
                          steps.add(stepLabel to s); stepLabel = ""; stepSeconds = ""
                      }) { Icon(Icons.Default.Add, "구간 추가") }
                  }
              }
          },
          confirmButton = {
              Button(onClick = {
                  if (label.isNotBlank() && steps.isNotEmpty()) {
                      onSave(label, steps.toList(), repeatCount.toIntOrNull() ?: 1)
                      onDismiss()
                  }
              }) { Text("저장") }
          },
          dismissButton = { TextButton(onClick = onDismiss) { Text("취소") } }
      )
  }
  ```

- [ ] **Step 4: 에뮬레이터에서 동작 확인**

  세션 추가 → 구간 2~3개 입력 → 시작 → 구간 전환 확인

- [ ] **Step 5: 커밋**

  ```bash
  git add app/src/
  git commit -m "feat: interval timer with foreground service"
  ```

---

### Task 9: 알람

**Files:**
- Create: `alarm/AlarmReceiver.kt`
- Create: `alarm/BootReceiver.kt`
- Create: `alarm/AlarmFullscreenActivity.kt`
- Create: `alarm/AlarmViewModel.kt`
- Modify: `alarm/AlarmScreen.kt`

**Interfaces:**
- Produces:
  - `AlarmViewModel.alarms: StateFlow<List<Alarm>>`
  - `.saveAlarm(alarm: Alarm)`
  - `.deleteAlarm(alarm: Alarm)`
  - `.toggleAlarm(alarm: Alarm)`
  - `AlarmScheduler.schedule(context, alarm)` — AlarmManager에 등록
  - `AlarmScheduler.cancel(context, alarm)` — 취소

- [ ] **Step 1: AlarmScheduler 유틸 작성**

  `alarm/AlarmScheduler.kt`:

  ```kotlin
  package com.multitimer.alarm

  import android.app.AlarmManager
  import android.app.PendingIntent
  import android.content.Context
  import android.content.Intent
  import com.multitimer.data.Alarm
  import java.util.Calendar

  object AlarmScheduler {
      fun schedule(context: Context, alarm: Alarm) {
          val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
          val intent = Intent(context, AlarmReceiver::class.java).apply {
              putExtra("alarm_id", alarm.id)
              putExtra("alarm_label", alarm.label)
          }
          val pi = PendingIntent.getBroadcast(context, alarm.id.toInt(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

          val cal = Calendar.getInstance().apply {
              set(Calendar.HOUR_OF_DAY, alarm.hour)
              set(Calendar.MINUTE, alarm.minute)
              set(Calendar.SECOND, 0)
              set(Calendar.MILLISECOND, 0)
              if (timeInMillis <= System.currentTimeMillis()) add(Calendar.DAY_OF_YEAR, 1)
          }

          if (alarm.daysOfWeek.isBlank()) {
              manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.timeInMillis, pi)
          } else {
              // 반복 알람: 가장 가까운 요일 계산
              val days = alarm.daysOfWeek.split(",").mapNotNull { it.trim().toIntOrNull() }
              val todayDow = cal.get(Calendar.DAY_OF_WEEK) // 1=일 ~ 7=토
              val calDays = days.map { if (it == 7) 1 else it + 1 } // 1=월 → Calendar.MONDAY=2
              var minOffset = Int.MAX_VALUE
              calDays.forEach { dow ->
                  var offset = dow - todayDow
                  if (offset < 0 || (offset == 0 && cal.timeInMillis <= System.currentTimeMillis())) offset += 7
                  if (offset < minOffset) minOffset = offset
              }
              cal.add(Calendar.DAY_OF_YEAR, minOffset)
              manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.timeInMillis, pi)
          }
      }

      fun cancel(context: Context, alarm: Alarm) {
          val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
          val pi = PendingIntent.getBroadcast(context, alarm.id.toInt(),
              Intent(context, AlarmReceiver::class.java),
              PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
          pi?.let { manager.cancel(it) }
      }
  }
  ```

- [ ] **Step 2: AlarmReceiver 작성**

  `alarm/AlarmReceiver.kt`:

  ```kotlin
  package com.multitimer.alarm

  import android.content.BroadcastReceiver
  import android.content.Context
  import android.content.Intent

  class AlarmReceiver : BroadcastReceiver() {
      override fun onReceive(context: Context, intent: Intent) {
          val label = intent.getStringExtra("alarm_label") ?: "알람"
          val fullscreenIntent = Intent(context, AlarmFullscreenActivity::class.java).apply {
              flags = Intent.FLAG_ACTIVITY_NEW_TASK
              putExtra("alarm_label", label)
          }
          context.startActivity(fullscreenIntent)
      }
  }
  ```

- [ ] **Step 3: BootReceiver 작성**

  `alarm/BootReceiver.kt`:

  ```kotlin
  package com.multitimer.alarm

  import android.content.BroadcastReceiver
  import android.content.Context
  import android.content.Intent
  import com.multitimer.data.AppDatabase
  import kotlinx.coroutines.*

  class BootReceiver : BroadcastReceiver() {
      override fun onReceive(context: Context, intent: Intent) {
          if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
          CoroutineScope(Dispatchers.IO).launch {
              val db = AppDatabase.getInstance(context)
              db.alarmDao().getEnabled().forEach { alarm ->
                  AlarmScheduler.schedule(context, alarm)
              }
          }
      }
  }
  ```

  `data/AppDatabase.kt`에 companion object 추가 (싱글톤 접근용):

  ```kotlin
  companion object {
      @Volatile private var INSTANCE: AppDatabase? = null
      fun getInstance(context: Context): AppDatabase =
          INSTANCE ?: synchronized(this) {
              INSTANCE ?: Room.databaseBuilder(context, AppDatabase::class.java, "multitimer.db").build().also { INSTANCE = it }
          }
  }
  ```

- [ ] **Step 4: AlarmFullscreenActivity 작성**

  `alarm/AlarmFullscreenActivity.kt`:

  ```kotlin
  package com.multitimer.alarm

  import android.os.Bundle
  import androidx.activity.ComponentActivity
  import androidx.activity.compose.setContent
  import androidx.compose.foundation.layout.*
  import androidx.compose.material3.*
  import androidx.compose.ui.Alignment
  import androidx.compose.ui.Modifier
  import androidx.compose.ui.unit.dp
  import androidx.compose.ui.unit.sp
  import com.multitimer.ui.theme.MultiTimerTheme

  class AlarmFullscreenActivity : ComponentActivity() {
      override fun onCreate(savedInstanceState: Bundle?) {
          super.onCreate(savedInstanceState)
          val label = intent.getStringExtra("alarm_label") ?: "알람"
          setContent {
              MultiTimerTheme {
                  Surface(Modifier.fillMaxSize()) {
                      Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                          Text("알람", fontSize = 32.sp)
                          Spacer(Modifier.height(16.dp))
                          Text(label, style = MaterialTheme.typography.headlineMedium)
                          Spacer(Modifier.height(48.dp))
                          Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                              OutlinedButton(onClick = { finish() }) { Text("다시 알림 (5분)") }
                              Button(onClick = { finish() }) { Text("끄기") }
                          }
                      }
                  }
              }
          }
      }
  }
  ```

  > 다시알림(snooze)은 `finish()` 호출 전 AlarmScheduler.schedule()에 5분 후 시간으로 재등록하면 됨 — 현 단계에선 UI만 구현.

- [ ] **Step 5: AlarmViewModel 작성**

  `alarm/AlarmViewModel.kt`:

  ```kotlin
  package com.multitimer.alarm

  import android.app.Application
  import androidx.lifecycle.AndroidViewModel
  import com.multitimer.data.Alarm
  import com.multitimer.data.AlarmDao
  import dagger.hilt.android.lifecycle.HiltViewModel
  import kotlinx.coroutines.*
  import kotlinx.coroutines.flow.*
  import javax.inject.Inject

  @HiltViewModel
  class AlarmViewModel @Inject constructor(
      app: Application,
      private val dao: AlarmDao
  ) : AndroidViewModel(app) {
      private val context get() = getApplication<Application>()
      private val scope = CoroutineScope(Dispatchers.IO)

      val alarms = dao.getAll().stateIn(scope, SharingStarted.Eagerly, emptyList())

      fun saveAlarm(alarm: Alarm) {
          scope.launch {
              val id = dao.upsert(alarm)
              val saved = alarm.copy(id = if (alarm.id == 0L) id else alarm.id)
              if (saved.isEnabled) AlarmScheduler.schedule(context, saved)
          }
      }

      fun deleteAlarm(alarm: Alarm) {
          scope.launch {
              AlarmScheduler.cancel(context, alarm)
              dao.delete(alarm)
          }
      }

      fun toggleAlarm(alarm: Alarm) {
          val updated = alarm.copy(isEnabled = !alarm.isEnabled)
          scope.launch {
              dao.upsert(updated)
              if (updated.isEnabled) AlarmScheduler.schedule(context, updated)
              else AlarmScheduler.cancel(context, updated)
          }
      }
  }
  ```

- [ ] **Step 6: AlarmScreen 작성**

  `alarm/AlarmScreen.kt`:

  ```kotlin
  package com.multitimer.alarm

  import androidx.compose.foundation.layout.*
  import androidx.compose.foundation.lazy.LazyColumn
  import androidx.compose.foundation.lazy.items
  import androidx.compose.material.icons.Icons
  import androidx.compose.material.icons.filled.*
  import androidx.compose.material3.*
  import androidx.compose.runtime.*
  import androidx.compose.ui.Alignment
  import androidx.compose.ui.Modifier
  import androidx.compose.ui.unit.dp
  import androidx.hilt.navigation.compose.hiltViewModel
  import com.multitimer.data.Alarm

  @Composable
  fun AlarmScreen(vm: AlarmViewModel = hiltViewModel()) {
      val alarms by vm.alarms.collectAsState()
      var showAdd by remember { mutableStateOf(false) }
      var editTarget by remember { mutableStateOf<Alarm?>(null) }

      Scaffold(
          floatingActionButton = {
              FloatingActionButton(onClick = { showAdd = true }) { Icon(Icons.Default.Add, "알람 추가") }
          }
      ) { padding ->
          LazyColumn(Modifier.padding(padding).fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
              items(alarms, key = { it.id }) { alarm ->
                  AlarmCard(alarm, onToggle = { vm.toggleAlarm(alarm) }, onEdit = { editTarget = alarm }, onDelete = { vm.deleteAlarm(alarm) })
                  Spacer(Modifier.height(8.dp))
              }
          }
      }

      if (showAdd) {
          AlarmEditDialog(alarm = null, onSave = { vm.saveAlarm(it); showAdd = false }, onDismiss = { showAdd = false })
      }
      editTarget?.let { target ->
          AlarmEditDialog(alarm = target, onSave = { vm.saveAlarm(it); editTarget = null }, onDismiss = { editTarget = null })
      }
  }

  @Composable
  fun AlarmCard(alarm: Alarm, onToggle: () -> Unit, onEdit: () -> Unit, onDelete: () -> Unit) {
      val days = listOf("월","화","수","목","금","토","일")
      val dayText = if (alarm.daysOfWeek.isBlank()) "한 번만" else alarm.daysOfWeek.split(",").mapNotNull { it.trim().toIntOrNull() }.joinToString(" ") { days.getOrElse(it - 1) { "" } }
      Card(Modifier.fillMaxWidth()) {
          Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
              Column(Modifier.weight(1f)) {
                  Text("%02d:%02d".format(alarm.hour, alarm.minute), style = MaterialTheme.typography.headlineSmall)
                  if (alarm.label.isNotBlank()) Text(alarm.label, style = MaterialTheme.typography.bodySmall)
                  Text(dayText, style = MaterialTheme.typography.bodySmall)
              }
              Switch(checked = alarm.isEnabled, onCheckedChange = { onToggle() })
              IconButton(onClick = onEdit) { Icon(Icons.Default.Edit, "편집") }
              IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, "삭제") }
          }
      }
  }

  @Composable
  fun AlarmEditDialog(alarm: Alarm?, onSave: (Alarm) -> Unit, onDismiss: () -> Unit) {
      var hour by remember { mutableStateOf(alarm?.hour?.toString() ?: "7") }
      var minute by remember { mutableStateOf(alarm?.minute?.toString() ?: "0") }
      var label by remember { mutableStateOf(alarm?.label ?: "") }
      val dayNames = listOf("월", "화", "수", "목", "금", "토", "일")
      val selectedDays = remember {
          val init = alarm?.daysOfWeek?.split(",")?.mapNotNull { it.trim().toIntOrNull() }?.toMutableSet() ?: mutableSetOf()
          mutableStateOf(init)
      }

      AlertDialog(
          onDismissRequest = onDismiss,
          title = { Text(if (alarm == null) "알람 추가" else "알람 편집") },
          text = {
              Column {
                  Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                      OutlinedTextField(value = hour, onValueChange = { hour = it }, label = { Text("시") }, modifier = Modifier.weight(1f))
                      OutlinedTextField(value = minute, onValueChange = { minute = it }, label = { Text("분") }, modifier = Modifier.weight(1f))
                  }
                  Spacer(Modifier.height(8.dp))
                  OutlinedTextField(value = label, onValueChange = { label = it }, label = { Text("레이블") })
                  Spacer(Modifier.height(8.dp))
                  Text("반복 요일 (선택 안 하면 한 번만)", style = MaterialTheme.typography.labelMedium)
                  Row {
                      dayNames.forEachIndexed { i, name ->
                          val day = i + 1
                          FilterChip(
                              selected = day in selectedDays.value,
                              onClick = {
                                  selectedDays.value = selectedDays.value.toMutableSet().also { if (day in it) it.remove(day) else it.add(day) }
                              },
                              label = { Text(name) },
                              modifier = Modifier.padding(end = 4.dp)
                          )
                      }
                  }
              }
          },
          confirmButton = {
              Button(onClick = {
                  val h = hour.toIntOrNull()?.coerceIn(0, 23) ?: return@Button
                  val m = minute.toIntOrNull()?.coerceIn(0, 59) ?: return@Button
                  val daysStr = selectedDays.value.sorted().joinToString(",")
                  onSave(Alarm(id = alarm?.id ?: 0, label = label, hour = h, minute = m, daysOfWeek = daysStr, isEnabled = true))
              }) { Text("저장") }
          },
          dismissButton = { TextButton(onClick = onDismiss) { Text("취소") } }
      )
  }
  ```

- [ ] **Step 7: 에뮬레이터에서 동작 확인**

  알람 추가 → 1~2분 후로 설정 → 잠금 화면에서 알람 팝업 확인

- [ ] **Step 8: 커밋**

  ```bash
  git add app/src/
  git commit -m "feat: alarm tab with AlarmManager, boot restore, fullscreen activity"
  ```

---

### Task 10: 최종 점검 & Play Store 출시 준비

**Files:**
- Modify: `app/build.gradle.kts` (서명 설정)
- Modify: `AndroidManifest.xml` (AdMob 실 ID 교체)

- [ ] **Step 1: 실 AdMob App ID 및 배너 ID 교체**

  1. AdMob 콘솔(admob.google.com) → 앱 추가 → Android → 앱 ID 복사
  2. `AndroidManifest.xml`의 `APPLICATION_ID` 메타데이터 값 교체
  3. `ui/AdBanner.kt`의 `adUnitId` 교체

- [ ] **Step 2: 서명 키스토어 생성**

  ```bash
  keytool -genkey -v -keystore multitimer-release.jks -alias multitimer -keyalg RSA -keysize 2048 -validity 10000
  ```

- [ ] **Step 3: app/build.gradle.kts 서명 설정**

  ```kotlin
  android {
      signingConfigs {
          create("release") {
              storeFile = file("multitimer-release.jks")
              storePassword = System.getenv("KEYSTORE_PASS")
              keyAlias = "multitimer"
              keyPassword = System.getenv("KEY_PASS")
          }
      }
      buildTypes {
          release {
              signingConfig = signingConfigs.getByName("release")
              isMinifyEnabled = true
          }
      }
  }
  ```

- [ ] **Step 4: Release APK/AAB 빌드**

  ```bash
  ./gradlew bundleRelease
  ```

  output: `app/build/outputs/bundle/release/app-release.aab`

- [ ] **Step 5: Play Store 제출**

  Google Play Console → 앱 만들기 → AAB 업로드 → 내부 테스트 트랙으로 먼저 출시

- [ ] **Step 6: 최종 커밋**

  ```bash
  git add app/build.gradle.kts
  git commit -m "chore: release signing and production AdMob IDs"
  ```

---

## 구현 순서 요약

| Task | 내용 | 선행 Task |
|------|------|---------|
| 1 | 프로젝트 셋업 | - |
| 2 | Room DB | 1 |
| 3 | Theme + 알림 채널 | 1 |
| 4 | Navigation + AdMob | 2, 3 |
| 5 | 타이머 Service + VM | 4 |
| 6 | 타이머 UI | 5 |
| 7 | 스톱워치 | 4 |
| 8 | 인터벌 | 4 |
| 9 | 알람 | 4 |
| 10 | 출시 준비 | 6, 7, 8, 9 |
