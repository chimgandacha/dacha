document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const galleryImages = [
    'photo_2026-09-15 12.32.54.jpeg',
    'photo_2026-09-15 12.33.02.jpeg',
    'photo_2026-09-15 12.33.04.jpeg',
    'photo_2026-09-15 12.33.07.jpeg',
    'photo_2026-09-15 12.33.08.jpeg',
    'photo_2026-09-15 12.33.10.jpeg',
    'photo_2026-09-15 12.33.13.jpeg',
    'photo_2026-09-15 12.33.15.jpeg',
    'photo_2026-09-15 12.33.16.jpeg',
    'photo_2026-09-15 12.33.17.jpeg',
    'photo_2026-09-15 12.33.18.jpeg',
    'photo_2026-09-15 12.33.19.jpeg',
    'photo_2026-09-15 12.33.20.jpeg',
    'photo_2026-09-15 12.33.22.jpeg',
    'photo_2026-09-15 12.33.23.jpeg',
    'photo_2026-09-15 12.33.24.jpeg',
    'photo_2026-09-15 12.33.25.jpeg',
    'photo_2026-09-15 12.33.26.jpeg',
    'photo_2026-09-15 12.33.28.jpeg',
    'photo_2026-09-15 12.33.29.jpeg'
  ];

  const galleryGrid = document.getElementById('galleryGrid');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const openGalleryBtn = document.getElementById('openGalleryBtn');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-nav.prev');
  const nextBtn = document.querySelector('.lightbox-nav.next');

  if (galleryGrid) {
    galleryImages.forEach((fileName, index) => {
      const img = document.createElement('img');
      img.src = `assets/${encodeURI(fileName)}`;
      img.alt = `Фото ${index + 1}`;
      img.loading = 'lazy';
      img.addEventListener('click', () => openLightbox(index));
      galleryGrid.appendChild(img);
    });
  }

  let currentIndex = 0;

  function openLightbox(index) {
    if (!lightbox || !lightboxImage) return;

    currentIndex = index;
    lightboxImage.src = `assets/${encodeURI(galleryImages[index])}`;
    lightboxImage.alt = `Фото ${index + 1}`;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;

    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function showNext(direction) {
    const total = galleryImages.length;
    if (!total) return;

    currentIndex = (currentIndex + direction + total) % total;
    lightboxImage.src = `assets/${encodeURI(galleryImages[currentIndex])}`;
    lightboxImage.alt = `Фото ${currentIndex + 1}`;
  }

  if (openGalleryBtn) {
    openGalleryBtn.addEventListener('click', () => openLightbox(0));
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => showNext(-1));
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => showNext(1));
  }

  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (!lightbox || !lightbox.classList.contains('active')) return;

    if (event.key === 'Escape') {
      closeLightbox();
    }

    if (event.key === 'ArrowRight') {
      showNext(1);
    }

    if (event.key === 'ArrowLeft') {
      showNext(-1);
    }
  });

  const bookingModal = document.getElementById('bookingModal');
  const bookingForm = document.getElementById('bookingForm');
  const statusBox = document.getElementById('formStatus');
  const bookingTriggers = document.querySelectorAll('.booking-trigger');
  const bookingClose = document.querySelector('.booking-close');

  function openBookingModal() {
    if (!bookingModal) return;
    bookingModal.classList.add('active');
    bookingModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeBookingModal() {
    if (!bookingModal) return;
    bookingModal.classList.remove('active');
    bookingModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  bookingTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openBookingModal();
    });
  });

  if (bookingClose) {
    bookingClose.addEventListener('click', closeBookingModal);
  }

  if (bookingModal) {
    bookingModal.addEventListener('click', (event) => {
      if (event.target === bookingModal) {
        closeBookingModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && bookingModal && bookingModal.classList.contains('active')) {
      closeBookingModal();
    }
  });

  if (bookingForm) {
    bookingForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(bookingForm);
      const payload = {
        name: formData.get('name')?.toString().trim() || '',
        phone: formData.get('phone')?.toString().trim() || '',
        checkin: formData.get('checkin')?.toString().trim() || '',
        checkout: formData.get('checkout')?.toString().trim() || '',
        guests: formData.get('guests')?.toString().trim() || '',
        message: formData.get('message')?.toString().trim() || '',
        wishes: formData.get('wishes')?.toString().trim() || ''
      };

      if (statusBox) {
        statusBox.textContent = 'Отправляем заявку...';
        statusBox.style.color = '#f4d89f';
      }

      try {
        const response = await fetch('/API/Booking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : null;

        if (!response.ok || !data || !data.ok) {
          throw new Error((data && data.error) || `Ошибка сервера (${response.status})`);
        }

        if (statusBox) {
          statusBox.textContent = 'Заявка отправлена успешно!';
          statusBox.style.color = '#8fe3a8';
        }

        bookingForm.reset();
        setTimeout(() => closeBookingModal(), 1200);
      } catch (error) {
        console.error(error);

        if (statusBox) {
          statusBox.textContent = error instanceof Error && error.message
            ? `Не удалось отправить заявку: ${error.message}`
            : 'Не удалось отправить заявку. Попробуйте позже или позвоните по телефону.';
          statusBox.style.color = '#ff9e9e';
        }
      }
    });
  }
});
