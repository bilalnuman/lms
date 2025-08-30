import React, { useState, useRef, useEffect } from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    goToPage: (page: number) => void;
    loading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    goToPage,
    loading = false,
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderPageButton = (page: number) => (
        <button
            key={page}
            onClick={() => {
                goToPage(page);
                setShowDropdown(false);
            }}
            disabled={loading || page === currentPage}
            className={`${styles.pageButton} ${page === currentPage ? styles.active : ''}`}
        >
            {page}
        </button>
    );

    const lastTwoPages = [totalPages - 1, totalPages];

    let secondPage: number;
    let thirdPage: number;

    if (currentPage <= 2) {
        secondPage = 2;
        thirdPage = 3;
    } else {
        secondPage = currentPage;
        thirdPage = currentPage + 1;
    }

    if (thirdPage >= totalPages - 1) {
        thirdPage = totalPages - 2;
        secondPage = thirdPage - 1;
    }

    const dropdownPages: number[] = [];
    for (let i = thirdPage + 1; i <= totalPages - 2; i++) {
        dropdownPages.push(i);
    }

    return (
        <div className={styles.pagination}>
            <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className={styles.navButton}
            >
                ←
            </button>

            {renderPageButton(1)}

            {secondPage > 1 && renderPageButton(secondPage)}
            {thirdPage > 1 && thirdPage < totalPages && renderPageButton(thirdPage)}

            {dropdownPages.length > 0 && (
                <div className={styles.dropdownWrapper} ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className={styles.pageButton}
                        disabled={loading}
                        type="button"
                    >
                        ...
                    </button>
                    {showDropdown && (
                        <select
                            className={styles.dropdownSelect}
                            value={currentPage}
                            onChange={(e) => {
                                const selectedPage = Number(e.target.value);
                                goToPage(selectedPage);
                                setShowDropdown(false);
                            }}
                            size={Math.min(dropdownPages.length, 10)}
                            autoFocus
                        >
                            {dropdownPages.map((page) => (
                                <option key={page} value={page}>
                                    {page}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            {lastTwoPages.map((page) => renderPageButton(page))}

            <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className={styles.navButton}
            >
                →
            </button>
        </div>
    );
};

export default Pagination;
