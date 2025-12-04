from flask import Flask, render_template, request, session, jsonify, flash, redirect, url_for
import word_manager
import statistics
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'my-secret-key'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start', methods=['GET', 'POST'])
def start_training():
    level = request.form.get('level', '1')
    language = request.form.get('language', 'ru')
    words = word_manager.load_words(level, language)
    session['training_data'] = {
        'level': level,
        'language': language,
        'words': words,
        'current_word_index': 0,
        'start_time': time.time(),
        'results': []
    }
    return render_template('trainer.html')

@app.route('/get_word')
def get_word():
    training_data = session.get('training_data', {})
    if not training_data.get('words'):
        return jsonify({'error': 'No words loaded'})

    current_index = training_data['current_word_index']
    words = training_data['words']
    if current_index >= len(words):
        return jsonify({'error': 'No more words'})

    current_word = words[current_index]
    return jsonify({
        'word': current_word,
        'progress': f"{current_index + 1}/{len(words)}"
    })

@app.route('/check_word', methods=['POST'])
def check_word():
    data = request.json
    user_input = data.get('input', '')
    time_spent = data.get('time_spent', 0)

    training_data = session.get('training_data', {})
    current_index = training_data['current_word_index']
    correct_word = training_data['words'][current_index]

    is_correct = user_input.strip() == correct_word
    errors = statistics.calculate_errors(correct_word, user_input)

    result = {
        'correct_word': correct_word,
        'user_input': user_input,
        'is_correct': is_correct,
        'errors': errors,
        'time_spent': time_spent
    }
    training_data['results'].append(result)

    training_data['current_word_index'] += 1
    session['training_data'] = training_data

    return jsonify({
        'correct': is_correct,
        'correct_word': correct_word,
        'errors': errors
    })

@app.route('/results')
def show_results():
    training_data = session.get('training_data', {})

    if not training_data.get('results'):
        return render_template('results.html', error="No results available")

    stats = statistics.calculate_session_stats(training_data['results'])

    return render_template('results.html', stats=stats)

@app.route('/add_word', methods=['POST'])
def add_custom_word():
    word = request.form.get('word', '').strip()
    level = request.form.get('level', '1')
    language = request.form.get('language', 'ru')

    if word:
        word_manager.add_custom_word(word, level, language)
        flash('Слово успешно добавлено!', 'success')
        return redirect(url_for('index'))

    return jsonify({'success': False})

if __name__ == '__main__':
    app.run(debug=True)
