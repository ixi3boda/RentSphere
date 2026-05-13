import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_IMAGES = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const ACCEPTED_LABEL = 'JPG, PNG only';

let _idCounter = 0;
const makeId = () => `img-${Date.now()}-${++_idCounter}`;

function ProgressBar({ percent }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-rentsphere-teal to-rentsphere-orange"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ ease: 'easeOut' }}
      />
    </div>
  );
}

function ImageUpload({ value = [], onChange, error, disabled = false }) {
  const inputRef = useRef(null);

  const [queue, setQueue] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');

  const totalCount =
    value.length + queue.filter((q) => q.status !== 'error').length;

  const canAddMore = totalCount < MAX_IMAGES && !disabled;

  const updateQueueItem = useCallback((id, patch) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  }, []);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const uploadFile = useCallback(
    async (queueItem) => {
      const { id, file } = queueItem;

      for (let p = 0; p <= 100; p += 20) {
        await new Promise((r) => setTimeout(r, 60));
        updateQueueItem(id, { progress: p });
      }

      const base64 = await fileToBase64(file);
      return base64;
    },
    [updateQueueItem]
  );

  const handleFiles = useCallback(
    async (files) => {
      setValidationError('');

      const fileList = Array.from(files);

      const invalid = fileList.filter((f) => !ACCEPTED_TYPES.includes(f.type));
      if (invalid.length) {
        setValidationError(`Only ${ACCEPTED_LABEL} files are allowed.`);
        return;
      }

      const slotsLeft = MAX_IMAGES - totalCount;
      if (slotsLeft <= 0) {
        setValidationError(`Maximum ${MAX_IMAGES} images allowed.`);
        return;
      }

      const toProcess = fileList.slice(0, slotsLeft);

      if (fileList.length > slotsLeft) {
        setValidationError(
          `Only ${slotsLeft} more image(s) can be added (max ${MAX_IMAGES}).`
        );
      }

      const newItems = toProcess.map((file) => ({
        id: makeId(),
        file,
        preview: URL.createObjectURL(file),
        status: 'uploading',
        progress: 0,
        url: null,
        errorMsg: '',
      }));

      setQueue((prev) => [...prev, ...newItems]);

      const successfulBase64s = [];

      for (const item of newItems) {
        try {
          const base64 = await uploadFile(item);

          updateQueueItem(item.id, {
            status: 'done',
            progress: 100,
            url: base64,
          });

          successfulBase64s.push(base64);

          setTimeout(() => {
            setQueue((prev) => prev.filter((q) => q.id !== item.id));
          }, 800);
        } catch (err) {
          updateQueueItem(item.id, {
            status: 'error',
            errorMsg: 'Failed to process image',
          });
        }
      }

      if (successfulBase64s.length > 0) {
        onChange([...value, ...successfulBase64s]);
      }
    },
    [totalCount, uploadFile, updateQueueItem, onChange, value]
  );

  const removeUploaded = (url) => {
    onChange(value.filter((u) => u !== url));
  };

  const removeQueueItem = (id) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const retryItem = (item) => {
    updateQueueItem(item.id, {
      status: 'uploading',
      progress: 0,
      errorMsg: '',
    });

    uploadFile(item)
      .then((base64) => {
        updateQueueItem(item.id, {
          status: 'done',
          progress: 100,
          url: base64,
        });

        onChange([...value, base64]);

        setTimeout(() => {
          setQueue((prev) => prev.filter((q) => q.id !== item.id));
        }, 800);
      })
      .catch(() => {
        updateQueueItem(item.id, {
          status: 'error',
          errorMsg: 'Failed to process image',
        });
      });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const allError = validationError || error;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Property Images{' '}
        <span className="text-gray-400 text-xs">
          ({totalCount}/{MAX_IMAGES} — {ACCEPTED_LABEL})
        </span>
      </label>

      {canAddMore && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          animate={{
            borderColor: dragOver ? '#14b8a6' : '#d1d5db',
          }}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-300 mb-3
            ${
              dragOver
                ? 'border-rentsphere-teal bg-rentsphere-teal/5'
                : 'border-gray-300 hover:border-rentsphere-teal hover:bg-rentsphere-teal/5'
            }`}
        >
          <div className="text-4xl mb-2">📸</div>

          <p className="text-gray-600 text-sm">
            Drag & drop images here, or{' '}
            <span className="text-rentsphere-teal font-semibold">
              click to browse
            </span>
          </p>

          <p className="text-gray-400 text-xs mt-1">
            {ACCEPTED_LABEL} — {MAX_IMAGES - totalCount} slot(s) remaining
          </p>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={disabled}
          />
        </motion.div>
      )}

      {(value.length > 0 || queue.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <AnimatePresence>
            {value.map((url, i) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={url}
                  alt={`uploaded-${i}`}
                  className="w-full h-full object-cover"
                />

                {i === 0 && (
                  <span className="absolute bottom-1 left-1 bg-rentsphere-teal text-white text-xs px-1.5 py-0.5 rounded">
                    Cover
                  </span>
                )}

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeUploaded(url)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-sm font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {queue.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`relative aspect-square rounded-lg overflow-hidden border
                  ${
                    item.status === 'error'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
              >
                <img
                  src={item.preview}
                  alt="uploading"
                  className={`w-full h-full object-cover transition-opacity duration-300
                    ${
                      item.status === 'uploading'
                        ? 'opacity-50'
                        : item.status === 'error'
                        ? 'opacity-30'
                        : 'opacity-100'
                    }`}
                />

                {item.status === 'uploading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 px-2">
                    <div className="text-white text-xs font-semibold mb-1">
                      {item.progress}%
                    </div>
                    <ProgressBar percent={item.progress} />
                  </div>
                )}

                {item.status === 'done' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/40">
                    <span className="text-white text-xl">✓</span>
                  </div>
                )}

                {item.status === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-500/30 px-1">
                    <span className="text-white text-xs font-bold text-center leading-tight">
                      {item.errorMsg}
                    </span>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => retryItem(item)}
                        className="text-xs bg-white text-rentsphere-teal font-semibold px-1.5 py-0.5 rounded"
                      >
                        ↻
                      </button>

                      <button
                        type="button"
                        onClick={() => removeQueueItem(item.id)}
                        className="text-xs bg-white text-red-500 font-semibold px-1.5 py-0.5 rounded"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {allError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-500 text-sm mt-2"
          >
            {allError}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ImageUpload;