import { supabase } from './supabase';
import platformUtils from '../utils/platformUtils';

// Capacitor imports - 동적으로 로드
let Camera,
  CameraResultType,
  CameraSource,
  Filesystem,
  Directory,
  Encoding,
  Device;

// Capacitor 플러그인 동적 로드
async function loadCapacitorPlugins() {
  try {
    if (await platformUtils.isNative()) {
      const cameraModule = await import('@capacitor/camera');
      const filesystemModule = await import('@capacitor/filesystem');
      const deviceModule = await import('@capacitor/device');

      Camera = cameraModule.Camera;
      CameraResultType = cameraModule.CameraResultType;
      CameraSource = cameraModule.CameraSource;
      Filesystem = filesystemModule.Filesystem;
      Directory = filesystemModule.Directory;
      Encoding = filesystemModule.Encoding;
      Device = deviceModule.Device;
    }
  } catch (error) {
    console.log('Capacitor 플러그인 로드 실패 (웹 환경에서는 정상):', error);
  }
}

/**
 * 이미지 업로드 관련 API 서비스
 * Supabase Storage를 사용하여 이미지 파일을 업로드하고 관리합니다.
 * 웹과 네이티브 환경 모두 지원
 */

/**
 * 카메라로 사진 촬영 (웹/네이티브 환경 지원)
 * @param {Object} options - 카메라 옵션
 * @returns {Promise<Object>} 촬영된 이미지 정보
 */
export const takePicture = async (options = {}) => {
  try {
    await loadCapacitorPlugins();

    return await platformUtils.safeApiCall(
      // 웹 환경: MediaDevices API 사용
      async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('카메라가 지원되지 않는 환경입니다.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        // 간단한 캔버스 캡처 구현
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        return new Promise((resolve, reject) => {
          video.srcObject = stream;
          video.play();

          video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            stream.getTracks().forEach(track => track.stop());

            const imageUri = canvas.toDataURL(
              'image/jpeg',
              options.quality || 0.9
            );
            resolve({
              success: true,
              imageUri,
              format: 'jpeg',
            });
          });

          video.addEventListener('error', reject);
        });
      },
      // 네이티브 환경: Capacitor Camera 사용
      async () => {
        const image = await Camera.getPhoto({
          quality: options.quality || 90,
          allowEditing: options.allowEditing || false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
        });

        return {
          success: true,
          imageUri: image.webPath,
          format: image.format,
        };
      }
    );
  } catch (error) {
    console.error('카메라 촬영 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 갤러리에서 사진 선택 (웹/네이티브 환경 지원)
 * @param {Object} options - 선택 옵션
 * @returns {Promise<Object>} 선택된 이미지 정보
 */
export const pickFromGallery = async (options = {}) => {
  try {
    await loadCapacitorPlugins();

    return await platformUtils.safeApiCall(
      // 웹 환경: HTML input file 사용
      async () => {
        return new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';

          input.addEventListener('change', event => {
            const file = event.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = e => {
                resolve({
                  success: true,
                  imageUri: e.target.result,
                  format: file.type.split('/')[1] || 'jpeg',
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            } else {
              reject(new Error('파일이 선택되지 않았습니다.'));
            }
          });

          input.click();
        });
      },
      // 네이티브 환경: Capacitor Camera 사용
      async () => {
        const image = await Camera.getPhoto({
          quality: options.quality || 90,
          allowEditing: options.allowEditing || false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos,
        });

        return {
          success: true,
          imageUri: image.webPath,
          format: image.format,
        };
      }
    );
  } catch (error) {
    console.error('갤러리 선택 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 이미지 파일을 Base64로 변환 (웹/네이티브 환경 지원)
 * @param {string} imageUri - 이미지 URI
 * @returns {Promise<string>} Base64 인코딩된 이미지
 */
export const convertToBase64 = async imageUri => {
  try {
    await loadCapacitorPlugins();

    return await platformUtils.safeApiCall(
      // 웹 환경: Canvas API 사용
      async () => {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();

          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
          };

          img.onerror = reject;
          img.src = imageUri;
        });
      },
      // 네이티브 환경: Filesystem 플러그인 사용
      async () => {
        const readFile = await Filesystem.readFile({
          path: imageUri,
        });

        return `data:image/jpeg;base64,${readFile.data}`;
      }
    );
  } catch (error) {
    console.error('Base64 변환 실패:', error);
    throw error;
  }
};

/**
 * 이미지 파일을 Supabase Storage에 업로드
 * @param {File} file - 업로드할 이미지 파일
 * @param {string} userId - 사용자 ID (폴더 구분용)
 * @param {string} folder - 저장할 폴더명 (기본값: 'posts')
 * @returns {Promise<Object>} 업로드 결과 및 이미지 URL
 */
export const uploadImage = async (file, userId, folder = 'posts') => {
  try {
    if (!file || !userId) {
      throw new Error('파일과 사용자 ID가 필요합니다.');
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        '지원하지 않는 파일 형식입니다. (JPG, PNG, WebP, GIF만 가능)'
      );
    }

    // 파일 크기 검증 (10MB 제한)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('파일 크기가 10MB를 초과합니다.');
    }

    // 파일명 생성 (중복 방지를 위해 타임스탬프와 랜덤 문자열 추가)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;

    // 저장 경로: users/{userId}/{folder}/{fileName}
    const filePath = `users/${userId}/${folder}/${fileName}`;

    console.log('이미지 업로드 시작:', {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
    });

    // Supabase Storage에 파일 업로드
    const { data, error } = await supabase.storage
      .from('images') // 버킷명: 'images'
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // 동일한 파일명이 있으면 오류 발생
      });

    if (error) {
      console.error('Supabase Storage 업로드 실패:', error);
      throw error;
    }

    // 업로드된 이미지의 공개 URL 가져오기
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

    console.log('이미지 업로드 성공:', {
      path: data.path,
      imageUrl,
    });

    return {
      success: true,
      data: {
        path: data.path,
        fileName,
        imageUrl,
        originalName: file.name,
        size: file.size,
        type: file.type,
      },
    };
  } catch (error) {
    console.error('이미지 업로드 중 오류:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 여러 이미지 파일을 동시에 업로드
 * @param {File[]} files - 업로드할 이미지 파일 배열
 * @param {string} userId - 사용자 ID
 * @param {string} folder - 저장할 폴더명 (기본값: 'posts')
 * @returns {Promise<Object>} 업로드 결과 배열
 */
export const uploadMultipleImages = async (files, userId, folder = 'posts') => {
  try {
    if (!files || files.length === 0) {
      throw new Error('업로드할 파일이 없습니다.');
    }

    if (files.length > 5) {
      throw new Error('한 번에 최대 5개의 이미지만 업로드할 수 있습니다.');
    }

    console.log(`${files.length}개의 이미지 동시 업로드 시작`);

    // 모든 파일을 병렬로 업로드
    const uploadPromises = files.map(file => uploadImage(file, userId, folder));
    const results = await Promise.all(uploadPromises);

    // 실패한 업로드 확인
    const failures = results.filter(result => !result.success);
    const successes = results.filter(result => result.success);

    if (failures.length > 0) {
      console.warn('일부 이미지 업로드 실패:', failures);
    }

    return {
      success: successes.length > 0,
      data: {
        uploaded: successes.map(result => result.data),
        failed: failures.map(result => result.error),
        totalCount: files.length,
        successCount: successes.length,
        failureCount: failures.length,
      },
    };
  } catch (error) {
    console.error('다중 이미지 업로드 중 오류:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 이미지 파일 삭제
 * @param {string} imagePath - 삭제할 이미지 경로
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteImage = async imagePath => {
  try {
    if (!imagePath) {
      throw new Error('이미지 경로가 필요합니다.');
    }

    const { data, error } = await supabase.storage
      .from('images')
      .remove([imagePath]);

    if (error) {
      console.error('이미지 삭제 실패:', error);
      throw error;
    }

    console.log('이미지 삭제 성공:', imagePath);

    return {
      success: true,
      data: {
        deletedPath: imagePath,
      },
    };
  } catch (error) {
    console.error('이미지 삭제 중 오류:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 이미지 파일 압축 (클라이언트 사이드)
 * @param {File} file - 압축할 이미지 파일
 * @param {number} maxWidth - 최대 너비 (기본값: 1200px)
 * @param {number} maxHeight - 최대 높이 (기본값: 1200px)
 * @param {number} quality - 압축 품질 (0.1-1.0, 기본값: 0.8)
 * @returns {Promise<File>} 압축된 이미지 파일
 */
export const compressImage = async (
  file,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
) => {
  return new Promise((resolve, reject) => {
    try {
      // 이미지 파일이 아닌 경우 원본 반환
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // 원본 이미지 크기
          const { width: originalWidth, height: originalHeight } = img;

          // 압축이 필요하지 않은 경우 원본 반환
          if (
            originalWidth <= maxWidth &&
            originalHeight <= maxHeight &&
            file.size <= 2 * 1024 * 1024
          ) {
            resolve(file);
            return;
          }

          // 비율 유지하면서 크기 조정
          let { width, height } = img;
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          // 캔버스 크기 설정
          canvas.width = width;
          canvas.height = height;

          // 이미지 그리기
          ctx.drawImage(img, 0, 0, width, height);

          // 압축된 이미지를 Blob으로 변환
          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(new Error('이미지 압축에 실패했습니다.'));
                return;
              }

              // File 객체로 변환
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              console.log('이미지 압축 완료:', {
                original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
                reduction: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`,
              });

              resolve(compressedFile);
            },
            file.type,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('이미지 로드에 실패했습니다.'));
      };

      // 이미지 로드
      img.src = URL.createObjectURL(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 이미지 미리보기 URL 생성
 * @param {File} file - 이미지 파일
 * @returns {string} 미리보기 URL
 */
export const createImagePreview = file => {
  try {
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('유효한 이미지 파일이 아닙니다.');
    }

    return URL.createObjectURL(file);
  } catch (error) {
    console.error('이미지 미리보기 생성 실패:', error);
    return null;
  }
};

/**
 * 이미지 미리보기 URL 해제
 * @param {string} previewUrl - 해제할 미리보기 URL
 */
export const revokeImagePreview = previewUrl => {
  try {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  } catch (error) {
    console.error('이미지 미리보기 해제 실패:', error);
  }
};

/**
 * 이미지 URL에서 파일 경로 추출
 * @param {string} imageUrl - 이미지 URL
 * @returns {string} 파일 경로
 */
export const extractImagePath = imageUrl => {
  try {
    if (!imageUrl) return null;

    // Supabase Storage URL 패턴에서 경로 추출
    const urlPattern = /\/storage\/v1\/object\/public\/images\/(.+)$/;
    const match = imageUrl.match(urlPattern);

    return match ? match[1] : null;
  } catch (error) {
    console.error('이미지 경로 추출 실패:', error);
    return null;
  }
};
