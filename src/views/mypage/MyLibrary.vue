<template>
  <div class="library-container">
    <LeftSidebar />
    <aside class="sidebar2">
      <nav>
        <ul>
          <li class="sidebar-item" v-for="menuItem in menuItems" :key="menuItem.title"
          :class="{ active: selectedStatus === menuItem.route }"
            @click="selectStatus(menuItem.route)">
            <img
              :src="`/src/assets/sidebar/${menuItem.icon}`"
              :alt="menuItem.title"
              class="sidebar-icon"
            />

            <div class="menuitem-grid">
              <h4>{{ menuItem.title }}</h4>
              <p class="menuitem-count">{{ menuItem.count }}</p>
            </div>
          </li>
        </ul>
      </nav>
    </aside>
    <div class="main-content">
      <header class="header">
        <h1 class="library-title">내 서재</h1>
        <h2 class="booklist-title"> {{ menuItems.find(item => item.route === selectedStatus)?.title || '전체 도서 목록' }}</h2>
      </header>
      <section class="book-list">
          <!-- 선택된 상태에 맞는 도서 목록 렌더링 -->
          <article
          class="book-item"
          v-for="(book) in filteredBooks"
          :key="book.isbn13"
        >
        <div class="bool-like-grid">
          <img
            :src="book.cover"
            alt="Book Cover"
            class="book-cover"
            @click="openModal(book)"
          />
          <img src="@/assets/icons/heart_circle_noline.png" class="book-like-icon" v-if="selectedStatus === 'liked' || book.isLiked">
        </div>
          <div class="book-details-block">
            <div class="title-grid">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="book-author">{{ book.author }}</p>
            </div>
            <div class="progress-grid" v-if="selectedStatus === 'reading'">
              <p class="book-progress">{{ progressStore.getProgress(book.isbn13)?.progressPercentage || 0 }}%</p>
              <p class="book-remaining">{{ calculateRemainingDays(book.endDate) }}일 남음</p>
            </div>
          </div>
          <div v-if="book.isFavorite" class="favorite-icon">
            <img src="@/assets/icons/like.png" alt="Favorite" />
          </div>
        </article>
      </section>
      <!-- 리뷰 조회 -->
    <MyReviewList 
    v-if="selectedStatus === 'myreview'"
    />

       <!-- 리뷰 모달  -->
    <ReviewForm :isVisible="showForm"
     :userId = authStore.user.userId
     :bookId="selectedBook"
     @update:isVisible="showForm = $event" />
    </div>
    <!-- 모달 컴포넌트 -->
    <BookDetailModal
      v-if="isModalVisible"
      :book="selectedBook"
      @close="closeModal"
      @openForm="showForm=true"
      @delete-library="deleteLibrary"
      @book-like-status="handleBookLikeStatus"
      @update-book-status="updateBookStatus"
    />
    <musicPlayer />
  </div>
</template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue';
  import LeftSidebar from '@/components/layouts/LeftSidebar.vue';
  import BookDetailModal from './BookDetailModal.vue';
  import ReviewForm from '@/components/review/ReviewForm.vue';
  import { useAuthStore } from '@/stores/auth';
  import apiClient from '@/api/axiosInstance';
  import { useProgressStore } from '@/stores/readingProgressbar';
  import MyReviewList from '../review/MyReviewList.vue';
  import musicPlayer from '@/components/layouts/musicPlayer.vue';

  const isGoalModalVisible = ref(false); // 모달 상태
  const authStore = useAuthStore();
  const menuItems = ref([]);
  const books = ref([]);
  const selectedStatus = ref('reading');
  const progressStore = useProgressStore();
  // 모달 상태 및 선택된 책 데이터
  const isModalVisible = ref(false);
  const selectedBook = ref({});
  const likedBooks = ref([]); // 좋아요된 책의 ISBN 목록
  // 리뷰 작성 모달 상태
  const showForm = ref(false);

  const getMyLibrary = async () => {
  try {
    const response = await apiClient.get(`/bookservice/library/${authStore.user.userId}`);
    books.value = prepareBooksData(response.data.data); // books 데이터를 가공
    updateMenuItems();
  } catch (error) {
    console.error("내 서재 데이터 불러오기 오류:", error);
  }
};

//그룹이 존재하지 않을 때 새 그룹을 생성하는 조건식
const groupedData = computed(() => {
      return books.value.reduce((acc, item) => {
        (acc[item.status] || (acc[item.status] = [])).push(item);
        return acc;
      }, {});
    });

// 사이드바 독서 상태별 렌더링
const updateMenuItems = () => {
      menuItems.value = [
        { title: '독서중', count: (groupedData.value.reading?.length || 0) +' 권', icon: 'openbook.png', route: 'reading' },
        { title: '담은 도서', count: (groupedData.value.wished?.length || 0) +' 권', icon: 'bookmark.png', route: 'wished' },
        { title: '완독', count:( groupedData.value.completed?.length || 0 )+' 권', icon: 'closedbook.png', route: 'completed' },
        { title: '좋아요한 도서', count:( likedBooks.value.length)+' 권', icon: 'book_heart.png', route: 'liked' },
        { title: '나의 리뷰',  icon: 'review.png', route: 'myreview'}
      ];
    };

// 사이드바 선택된 상태 변경
const selectStatus = (status) => {
  selectedStatus.value = status;
};

// 모달에서 받은 업데이트된 데이터 처리
const updateBookStatus = (updatedBook) => {
  // 서재 데이터 업데이트
  const bookIndex = books.value.findIndex((book) => book.isbn13 === updatedBook.isbn13);
  if (bookIndex !== -1) {
    books.value[bookIndex] = { ...updatedBook }; // 서재 데이터 업데이트
  } else {
    books.value.push(updatedBook); // 새로운 도서 추가
  }

  // 좋아요 데이터가 필요한 경우 새로고침
  if (selectedStatus.value === "liked") {
    getBookLikeStatus(); // 좋아요 데이터를 새로 가져옴
  }
};


// 현재 선택된 상태에 따른 책 필터링
const filteredBooks = computed(() => {
  if (selectedStatus.value === "liked") {
    return likedBooks.value; // 좋아요 데이터만 사용
  }
  return (groupedData.value[selectedStatus.value] || []).map((book) => ({
    ...book,
    isLiked: likedBooks.value.some((like) => like.isbn13 === book.isbn13),
  }));
});

// 좋아요 상태
const handleBookLikeStatus = async () => {
  try {
    // 좋아요 상태를 다시 불러오기
    await getBookLikeStatus();
    updateMenuItems(); // 메뉴 카운트 업데이트

    // 좋아요 상태가 "liked"일 때 화면 즉시 새로고침
    if (selectedStatus.value === "liked") {
      await getMyLibrary(); // 전체 도서 목록 새로고침
    }
  } catch (error) {
    console.error("좋아요 상태 변경 처리 오류:", error);
  }
};


// 좋아요 상태 확인
const getBookLikeStatus = async () => {
  try {
    const response = await apiClient.get(`/bookservice/library/book-like/${authStore.user.userId}`);
    console.log(response.data);
    const likedData = response.data.data.map((item) => ({
      author: item.bookDTO.author,
      cover: item.bookDTO.cover,
      bookLikeId: item.bookLikeId,
      userId: item.userId,
      isbn13: item.bookDTO.isbn13,
      title: item.bookDTO.title,
      description: item.bookDTO.description,
      pubdate: item.bookDTO.pubdate,
      startindex: item.bookDTO.startindex,
      libraryId: null,
      status: null,
      isLiked: true,
    }));

    // 서재 데이터와 병합
    likedBooks.value = likedData.map((likedBook) => {
      // 서재 데이터에서 동일한 ISBN을 가진 책을 찾음
      const libraryBook = books.value.find((book) => book.isbn13 === likedBook.isbn13);

      if (libraryBook) {
        // 서재에 존재하면 libraryId와 status를 업데이트
        return {
          ...likedBook,
          libraryId: libraryBook.libraryId,
          status: libraryBook.status,
        };
      }
      // 서재에 없으면 그대로 반환
      return likedBook;
    });
  } catch (error) {
    console.error("좋아요 상태 불러오기 오류:", error);
    likedBooks.value = [];
  }
};

// 도서 상세 모달 열기 / 닫기기
const openModal = (book) => {
  selectedBook.value = { ...book }; // 최신 데이터 설정
  isModalVisible.value = true;
};

const closeModal = () => {
  isModalVisible.value = false;
  // 선택된 책의 상태를 업데이트
  if (selectedBook.value.libraryId || selectedBook.value.status) {
    updateBookStatus(selectedBook.value); 
  }
  getMyLibrary();
};


// books 데이터에 progress, remainingDays, 좋아요 상태 추가
const prepareBooksData = (books) => {
  return books.map((book) => {
    const progressData = progressStore.getProgress(book.isbn13);
    const progressPercentage = progressData?.progressPercentage || 0; // 기본값 0 설정
    return {
      ...book,
      progress: progressPercentage,
      remainingDays: calculateRemainingDays(book.endDate),
      isLiked: likedBooks.value.includes(book.isbn13),
    };
  });
};

// 남은 일 수 계산 함수
const calculateRemainingDays = (endDate) => {
  if (!endDate) return 0; // endDate가 없는 경우 0 반환
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - today.getTime(); // 밀리초 차이 계산
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 일 단위로 변환
  return diffDays > 0 ? diffDays : 0; // 음수일 경우 0 반환
};

// 내 서재에서 담기 삭제
const deleteLibrary = async (libraryId) => {
  try {
    await apiClient.delete(`/bookservice/library/${authStore.user.userId}/${libraryId}`);

    // 서재 데이터에서 제거
    books.value = books.value.filter((book) => book.libraryId !== libraryId);

    // 좋아요 데이터 업데이트
    const likedIndex = likedBooks.value.findIndex((book) => book.libraryId === libraryId);
    if (likedIndex !== -1) {
      likedBooks.value[likedIndex] = {
        ...likedBooks.value[likedIndex],
        libraryId: null,
        status: null,
      };
    }
    getMyLibrary();
  } catch (error) {
    console.error("서재 삭제 실패:", error);
  }
};

onMounted(async() => {
  await getMyLibrary();
  await getBookLikeStatus();
  updateMenuItems();
});
</script>
  
  <style scoped>
  .library-container {
    height: 100vh;
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: 0fr 0fr 1fr;
  }
  
  .sidebar2 {
    width: 250px;
    padding: 10px;
  }
  
  .sidebar-item {
    display: flex;
    align-items: center;
    padding: 20px 0px;
    margin-left: 20px;
    transition: background-color 0.3s ease;
  }
  .sidebar-item:hover {
    cursor: pointer;
    color: #1db954;
  }
  
  .sidebar-icon {
    width: 30px;
    height: 30px;
    margin-right: 10px;
  }
  
  .main-content {
    width: 70%;
    padding: 20px 0px;
    margin-left: 8%;
  }
  
  .header {
    border-bottom: 1px solid #000;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
  
  .library-title {
    font-size: 25px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 40px;
  }
  
  .booklist-title {
    font-size: 20px;
    font-weight: 400;
  }
  
  .book-list {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    justify-items: start;
  }
  
  .book-item {
    display: grid;
    width: min-content;
    justify-self: center;
    align-self: flex-start;
  }
  
  .book-item:hover {
    cursor: pointer;
  }
  
  .book-cover {
    width: 143px;
    height: 210px;
    position: relative;
  }
  
  .book-details-block {
    margin-top: 10px;
  }
  
  .book-title {
    font-size: 15px;
    font-weight: bold;
    color: #1f1f1f;
    margin-bottom: 5px;
  }
  
  .book-author {
    font-size: 13px;
    color: #707070;
    margin-bottom: 5px;
  }
  
  .book-progress {
    font-size: 15px;
    color: #414141;
    margin-bottom: 2px;
  }
  
  .book-remaining {
    font-size: 15px;
    color: #ff5e00;
  }
  
  .favorite-icon {
    position: absolute;
    top: 17px;
    right: 15px;
    width: 24px;
    height: 24px;
  }
  
  .favorite-icon img {
    width: 100%;
    height: 100%;
  }
  .title-grid {
    min-height: 50px;
  }
  .progress-grid {
    display: flex;
    gap: 10px;
  }
  
  .menuitem-count {
    color: #383838;
    font-size: 14px;
  }
  .menuitem-grid {
    display: flex;
    gap: 3px;
    flex-flow: column;
  }

  .bool-like-grid {
  position: relative; /* 부모 컨테이너를 기준으로 위치 설정 */
  display: inline-block;
}
.book-like-icon {
  position: absolute; /* 부모 컨테이너를 기준으로 절대 위치 설정 */
  top: 7px; /* 상단으로부터의 거리 */
  right: 7px; /* 오른쪽으로부터의 거리 */
  width: 24px; /* 아이콘 크기 */
  height: 24px;
}
.menuitem-grid h4 {
  font-weight: bold;
}
.review-icon {
  margin-left: 4px;
  margin-right: 8px;
  width: 28px;
}
.review-title{
  font-weight: bold;
}
</style>