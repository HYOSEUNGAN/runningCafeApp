/**
 * Supabase 에러 핸들링 및 유틸리티 함수들
 */

/**
 * Supabase 에러를 사용자 친화적인 메시지로 변환
 * @param {Object} error - Supabase 에러 객체
 * @returns {string} 사용자 친화적인 에러 메시지
 */
export const getSupabaseErrorMessage = error => {
  if (!error) return '알 수 없는 오류가 발생했습니다.';

  // 일반적인 Supabase 에러 코드별 메시지
  const errorMessages = {
    // 인증 관련
    invalid_credentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
    email_not_confirmed: '이메일 인증이 필요합니다.',
    signup_disabled: '회원가입이 비활성화되어 있습니다.',
    user_not_found: '사용자를 찾을 수 없습니다.',
    session_not_found: '세션이 만료되었습니다. 다시 로그인해주세요.',

    // 데이터베이스 관련
    PGRST116: '데이터를 찾을 수 없습니다.',
    PGRST301: '요청한 데이터 형식이 올바르지 않습니다.',
    PGRST204: '요청이 성공했지만 반환할 데이터가 없습니다.',
    PGRST103: '데이터베이스 스키마 오류입니다.',

    // 권한 관련
    42501: '데이터에 접근할 권한이 없습니다.',
    '42P01': '요청한 테이블이 존재하지 않습니다.',

    // 네트워크 관련
    NetworkError: '네트워크 연결을 확인해주세요.',
    TimeoutError: '요청 시간이 초과되었습니다.',

    // HTTP 상태 코드
    400: '잘못된 요청입니다.',
    401: '인증이 필요합니다.',
    403: '접근 권한이 없습니다.',
    404: '요청한 리소스를 찾을 수 없습니다.',
    406: '요청 형식이 허용되지 않습니다.',
    409: '데이터 충돌이 발생했습니다.',
    422: '입력 데이터가 올바르지 않습니다.',
    429: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    500: '서버 내부 오류가 발생했습니다.',
    502: '서버가 일시적으로 사용할 수 없습니다.',
    503: '서비스가 일시적으로 중단되었습니다.',
  };

  // 에러 코드로 메시지 찾기
  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  // HTTP 상태 코드로 메시지 찾기
  if (error.status && errorMessages[error.status.toString()]) {
    return errorMessages[error.status.toString()];
  }

  // 에러 메시지에서 키워드 찾기
  const message = error.message || error.error_description || '';

  if (message.includes('duplicate key')) {
    return '이미 존재하는 데이터입니다.';
  }

  if (message.includes('foreign key')) {
    return '관련된 데이터가 존재하지 않습니다.';
  }

  if (message.includes('not null')) {
    return '필수 정보가 누락되었습니다.';
  }

  if (message.includes('check constraint')) {
    return '입력 데이터가 유효하지 않습니다.';
  }

  // 기본 메시지 반환
  return message || '알 수 없는 오류가 발생했습니다.';
};

/**
 * Supabase 쿼리 결과를 안전하게 처리
 * @param {Function} queryFn - 실행할 Supabase 쿼리 함수
 * @param {Object} options - 옵션
 * @param {boolean} options.expectSingle - 단일 결과를 기대하는지 여부
 * @param {string} options.errorContext - 에러 컨텍스트 (로깅용)
 * @returns {Promise<Object>} 처리된 결과
 */
export const safeSupabaseQuery = async (queryFn, options = {}) => {
  const { expectSingle = false, errorContext = 'Supabase 쿼리' } = options;

  try {
    const result = await queryFn();

    if (result.error) {
      console.error(`${errorContext} 실패:`, result.error);
      return {
        success: false,
        error: getSupabaseErrorMessage(result.error),
        data: null,
      };
    }

    // 단일 결과를 기대하지만 결과가 없는 경우
    if (
      expectSingle &&
      (!result.data || (Array.isArray(result.data) && result.data.length === 0))
    ) {
      return {
        success: false,
        error: '요청한 데이터를 찾을 수 없습니다.',
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: result.data,
    };
  } catch (error) {
    console.error(`${errorContext} 중 예외 발생:`, error);
    return {
      success: false,
      error: getSupabaseErrorMessage(error),
      data: null,
    };
  }
};

/**
 * 좋아요 상태를 안전하게 확인
 * @param {Object} supabase - Supabase 클라이언트
 * @param {string} postId - 포스트 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 좋아요 상태 결과
 */
export const checkLikeStatusSafely = async (supabase, postId, userId) => {
  return safeSupabaseQuery(
    () =>
      supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .limit(1),
    {
      expectSingle: false,
      errorContext: '좋아요 상태 확인',
    }
  );
};

/**
 * 데이터 존재 여부를 안전하게 확인
 * @param {Object} supabase - Supabase 클라이언트
 * @param {string} table - 테이블 명
 * @param {Object} conditions - 조건 객체
 * @returns {Promise<boolean>} 존재 여부
 */
export const checkDataExists = async (supabase, table, conditions) => {
  try {
    let query = supabase
      .from(table)
      .select('id', { count: 'exact', head: true });

    // 조건 적용
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { count, error } = await query;

    if (error) {
      console.error(`데이터 존재 확인 실패 (${table}):`, error);
      return false;
    }

    return count > 0;
  } catch (error) {
    console.error(`데이터 존재 확인 중 예외 (${table}):`, error);
    return false;
  }
};

/**
 * 페이지네이션을 위한 안전한 범위 계산
 * @param {number} page - 페이지 번호 (1부터 시작)
 * @param {number} limit - 페이지당 아이템 수
 * @returns {Object} from, to 값
 */
export const calculatePaginationRange = (page = 1, limit = 10) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { from, to };
};

/**
 * Supabase RPC 함수를 안전하게 호출
 * @param {Object} supabase - Supabase 클라이언트
 * @param {string} functionName - RPC 함수명
 * @param {Object} params - 함수 파라미터
 * @param {string} errorContext - 에러 컨텍스트
 * @returns {Promise<Object>} 실행 결과
 */
export const safeRpcCall = async (
  supabase,
  functionName,
  params = {},
  errorContext = 'RPC 호출'
) => {
  return safeSupabaseQuery(() => supabase.rpc(functionName, params), {
    expectSingle: false,
    errorContext: `${errorContext} (${functionName})`,
  });
};

/**
 * 배치 작업을 안전하게 실행
 * @param {Array} operations - 실행할 작업 배열
 * @param {number} batchSize - 배치 크기
 * @returns {Promise<Array>} 실행 결과 배열
 */
export const executeBatchOperations = async (operations, batchSize = 10) => {
  const results = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);

    try {
      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults);
    } catch (error) {
      console.error(
        `배치 작업 실행 실패 (배치 ${Math.floor(i / batchSize) + 1}):`,
        error
      );
      // 실패한 배치는 rejected 상태로 추가
      results.push(...batch.map(() => ({ status: 'rejected', reason: error })));
    }
  }

  return results;
};

/**
 * 재시도 로직이 포함된 Supabase 쿼리 실행
 * @param {Function} queryFn - 실행할 쿼리 함수
 * @param {Object} options - 재시도 옵션
 * @param {number} options.maxRetries - 최대 재시도 횟수
 * @param {number} options.delay - 재시도 간격 (ms)
 * @param {string} options.errorContext - 에러 컨텍스트
 * @returns {Promise<Object>} 실행 결과
 */
export const retrySupabaseQuery = async (queryFn, options = {}) => {
  const {
    maxRetries = 3,
    delay = 1000,
    errorContext = 'Supabase 쿼리',
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFn();

      if (!result.error) {
        return {
          success: true,
          error: null,
          data: result.data,
        };
      }

      lastError = result.error;

      // 재시도하지 않을 에러들
      const nonRetryableErrors = ['PGRST116', '401', '403', '404', '422'];
      if (
        nonRetryableErrors.includes(result.error.code) ||
        nonRetryableErrors.includes(result.error.status?.toString())
      ) {
        break;
      }
    } catch (error) {
      lastError = error;
    }

    // 마지막 시도가 아니면 대기
    if (attempt < maxRetries) {
      console.warn(
        `${errorContext} 실패, ${delay}ms 후 재시도 (${attempt}/${maxRetries}):`,
        lastError
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(
    `${errorContext} 최종 실패 (${maxRetries}회 재시도):`,
    lastError
  );
  return {
    success: false,
    error: getSupabaseErrorMessage(lastError),
    data: null,
  };
};
