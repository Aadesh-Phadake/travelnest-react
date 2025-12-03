import { useSelector } from 'react-redux';

export const useAdminMessages = () => {
  const { contactMessages } = useSelector((state) => state.admin);
  return { contactMessages };
};
