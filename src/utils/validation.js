// 이메일 유효성 검사
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 비밀번호 유효성 검사 (최소 8자, 영문+숫자 포함)
export const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
};

// 휴대폰 번호 유효성 검사
export const isValidPhone = (phone) => {
  const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
  return phoneRegex.test(phone);
};

// 닉네임 유효성 검사 (2-10자, 한글/영문/숫자)
export const isValidNickname = (nickname) => {
  const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,10}$/;
  return nicknameRegex.test(nickname);
};
