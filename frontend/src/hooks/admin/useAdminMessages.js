import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMessages } from '../../redux/admin/messagesSlice';

export const useAdminMessages = () => {
    const dispatch = useDispatch();
    const { messages, loading, error } = useSelector((state) => state.messages);

    useEffect(() => {
        dispatch(fetchMessages());
    }, [dispatch]);

    return {
        messages,
        loading,
        error
    };
};
