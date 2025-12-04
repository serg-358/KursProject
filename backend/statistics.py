def calculate_errors(correct_word, user_input):
    errors = []

    if len(correct_word) != len(user_input):
        errors.append({
            'position': min(len(correct_word), len(user_input)),
            'correct': correct_word[min(len(correct_word), len(user_input)):] if len(correct_word) > len(user_input) else '',
            'typed': user_input[min(len(correct_word), len(user_input)):] if len(user_input) > len(correct_word) else '',
            'length_mismatch': True
        })

    min_length = min(len(correct_word), len(user_input))
    for i in range(min_length):
        if correct_word[i] != user_input[i]:
            errors.append({
                'position': i,
                'correct': correct_word[i],
                'typed': user_input[i]
            })

    return errors

def calculate_session_stats(results):
    total_words = len(results)
    correct_words = sum(1 for r in results if r['is_correct'])
    total_errors = sum(len(r['errors']) for r in results)

    error_words = [
        {'word': r['correct_word'], 'errors': r['errors']}
        for r in results if r['errors']
    ]

    total_time = sum(r['time_spent'] for r in results)

    total_chars = sum(len(r['correct_word']) for r in results)
    cpm = (total_chars / total_time) * 60 if total_time > 0 else 0
    accuracy = (correct_words / total_words) * 100 if total_words > 0 else 0

    return {
        'total_words': total_words,
        'correct_words': correct_words,
        'total_errors': total_errors,
        'error_words': error_words,
        'cpm': round(cpm, 2),
        'accuracy': round(accuracy, 2),
        'total_time': round(total_time, 2)
    }