

import PropTypes from 'prop-types';
import React from 'react';
import { Pagination as NextUIPagination } from '@heroui/react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePageChange = (newPage) => {
    onPageChange(newPage);
  };

  return (
    <div className="flex justify-center mt-4">
      <NextUIPagination 
        page={currentPage}
        total={totalPages}
        onChange={handlePageChange}
      />
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default Pagination;
