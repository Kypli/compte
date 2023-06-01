// JS IMPORT
import { ucFirst } from '../service/service.js';
import { updateTable } from './compte.js';

// CSS
import '../../styles/compte/modalOperation.css';

$(document).ready(function(){

	////////////
	// ON LOAD
	////////////

	var
		_add = '',
		_save_operations = [],
		_input_datas = {}
	;

	////////////
	// ON EVENTS
	////////////

	/** Chargement **/

	// Get Operations
	$("body").not('.counterEdit, .td_category_libelle, .td_subcategory_libelle').on("click", ".edit td:not(.counterEdit, .td_category_libelle, .td_subcategory_libelle)", function(e){

		let
			sc_id = $(this).data('scid'),
			sign = $(this).parent().parent().parent().data('sign'),
			month = $(this).data('month'),
			months = $('#datas').data('months'),
			year = $('#datas').data('year')
		;

		getOperations(sc_id, sign, months, month, year)
	})


	/** Édition **/

	// Add 1 input
	$("body").on("click", "#modalOperationAdd", function(e){
		addOpe()
	})

	// Retrait (only delete add)
	$("body").on("click", ".inputRetrait", function(e){
		$(this).parent().parent().parent().parent('.tr_add').remove()
		calculSolde()

		// Plus d'édition
		if ($('#operation_tab').find('.inputComment').length == 0 && $('#operation_tab').find('.tr_add').length == 0){
			editMod(false)
		}
	})

	// Delete
	$("body").on("click", ".delete", function(e){
		let ope_id = $(this).data('opeid')
		$('#ope_id_' + ope_id).remove()
		calculSolde()
		editMod(true)
	})

	// Cancel edit
	$("body").on("click", "#cancel_operation", function(e){
		editMod(false)
		show(
			_save_operations,
			$('#operation_tab tbody').data('month'),
			$('#operation_tab tbody').data('year'),
			$('#operation_tab tbody').data('daysinmonth')
		)
	})


	/** Change **/

	// changeModFull
	$("body").on("click", "#modalOperationFullEdit", function(e){
		$(this).val() == 0
			? changeModFull()
			: changeModFull(false)
	})

	// Switch
	$("body").on("click", ".switch", function(e){
		toggleInputNumberAnticipe($(this).parent('td').parent('tr'))
	})

	// Toggle divToInput
	$("body").on("click", ".td_number, .td_anticipe, .td_switch, .td_date, .td_comment", function(e){
		toggleInputDiv($(this).parent())
		controlOperation()
	})

	// Toggle inputToDiv
	$("body").on("click", ".noForm", function(e){
		if (!$(this).hasClass('invalid')){
			toggleInputDiv($(this).parent().parent().parent().parent(), false)
		}
		controlOperation()
	})


	/** Save **/

	// Save
	$("body").on("click", "#modalOperationSaveClose", function(e){
		sauvegarde()
	})

	// Control + calcul
	$("body").on("input", ".inputNumber, .inputAnticipe", function(e){
		controlOperation()
		calculSolde()
	})
	$("body").on("click", ".inputRetrait, #modalOperationAdd, .delete", function(e){
		controlOperation()
		calculSolde()
	})


	////////////
	// FONCTIONS
	////////////

	/** Chargement **/

	function getOperations(sc_id, sign, months, month, year){

		$.ajax({
			type: "POST",
			url: Routing.generate('compte_operation', { sc: sc_id, year: year, month: month, sign: sign }),
			timeout: 15000,
			beforeSend: function(){
				editMod(false)
				meta1(year, months[month])
				spinner(true)
			},
			success: function(response){
				let operations = response.operations
				getInputAdd(month, year, response.days_in_month, sign, operations)
				meta2(response.category_libelle, response.subcategory_libelle, sign)
				show(operations, month, year, response.days_in_month, sc_id, sign)
				spinner(false)
				getInputDatas()
			},
			error: function(error){
				console.log('Erreur ajax: ' + error)
				spinner(false)
			}
		})
	}

	function getInputAdd(month, year, daysInMonth, sign, operations){

		$.ajax({
			type: "POST",
			url: Routing.generate('compte_operation_add', { month: month, year: year, daysInMonth: daysInMonth, sign: sign }),
			timeout: 15000,
			success: function(response){
				_add = response.render

				// Add 1 ope if none
				if (operations.length == 0){
					addOpe()
					editMod(true)
					controlOperation()
				}

			},
			error: function(error){
				console.log('Erreur ajax: ' + error)
			}
		})
	}

	function spinner(etat){
		if (etat){
			$('.spinner').show()

		} else {
			$('.spinner').hide()
		}
	}

	// Clean Text header + body
	function meta1(year, month){

		// HEAD DATE
		$('#date_annee').text(year)
		$('#date_mois').text(ucFirst(month))

		// HEAD LIBELLE + COLOR
		$('#category').text('.............')
		$('#subcategory').text('.............')
		$('#category, #subcategory, #solde').removeClass("total_month_full_pos").removeClass("total_month_full_neg")

		// BODY
		$('#operation_tab tbody tr').not('#tr_solde, #solde_tr_collabo').remove()
		$('#tr_solde').hide()
		$('#solde').text('0').hide()
		changeModFull(false)
	}

	// Text header + show body
	function meta2(cat_libelle, subcat_libelle, sign){

		// HEAD LIBELLE
		$('#category').text(ucFirst(cat_libelle))
		$('#subcategory').text(ucFirst(subcat_libelle))
		$('#solde, #tr_solde').show()
		sign = sign == 1 ? 'pos' : 'neg'
		$('#category, #subcategory, #solde').addClass('total_month_full_' + sign)
	}

	function show(operations, month, year, daysInMonth, sc_id, sign){

		_save_operations = operations

		// UPDATE TBODY
		$('#operation_tab tbody')
			.data('year', year)
			.data('month', month)
			.data('daysinmonth', daysInMonth)
			.data('scid', sc_id)
			.data('sign', sign)
		;
		$('#operation_tab tbody tr')
			.not('#tr_solde, #solde_tr_collabo')
			.remove()
		;

		let
			tr = "",
			day = ''
		;

		operations.forEach(function(item, index){

			day = item.day < 10 ? '0' + item.day : item.day
			month = item.month < 10 ? '0' + item.month : item.month

			tr =
				"<tr id='ope_id_" + item.id + "' class='tr_ope'>" +
					"<td class='td_number'>" + (item.anticipe ? '' : item.number) + "</td>" +
					"<td class='td_switch'>" +
						"<span class='switch hide'><i class='fa-solid fa-repeat'></i></span>" +
					"</td>" +
					"<td class='td_anticipe'>" +
						(item.anticipe ? item.number : '') +
					"</td>" +
					"<td class='td_date p-1'>" + day + '/' + month + '/' + item.year + "</td>" +
					"<td class='td_comment p-1'>" + ucFirst(item.comment) + "</td>" +
					"<td class='td_actions'>" +
						"<div class='hide btn-group'>" +
							"<button " +
								"type='button'" +
								"class='btn btn-default dropdown-toggle'" +
								"data-toggle='dropdown'" +
								"aria-haspopup='true'" +
								"aria-expanded='false'" +
							">" +
								"<i class='fas fa-cog'></i>" +
								"<span class='caret'></span>" +
							"</button>" +
							"<ul class='dropdown-menu options p-1'>" +
								"<li class='invalid' title='Fonctionnalité à venir'>Dupliquer</li>" +
								"<li class='invalid' title='Fonctionnalité à venir'>Attribuer</li>" +
								"<li class='invalid noForm'>Retire mode édition</li>" +
								"<li class='invalid'>...</li>" +
								"<li><hr></li>" +
								"<li class='delete' data-opeid='" + item.id + "'>Supprimer</li>" +
							"</ul>" +
						"</div>" +
					"</td>" +
				"</tr>"

			$('#operation_tab tbody').append(tr)

			tr = ''
		})

		$('#solde_tr_collabo').insertAfter('#operation_tab tbody tr:last')
		$('#tr_solde').insertAfter('#operation_tab tbody tr:last')
		calculSolde()
	}

	// Récupère les datas des input pour control édition
	function getInputDatas(){

		// Reset
		_input_datas = {}

		// Number + Anticipe
		$('#operation_tab .tr_ope').each(function(index, div){
			let id = div.id
			_input_datas[id+'_number'] = $('#' + id + ' .td_number').text().trim()
			_input_datas[id+'_anticipe'] = $('#' + id + ' .td_anticipe').text().trim()
		})
	}


	/** Add **/

	// Add 1 operation
	function addOpe(){
		$('#operation_tab tbody').append(_add)
		$('#solde_tr_collabo').insertAfter('#operation_tab tbody tr:last')
		$('#tr_solde').insertAfter('#operation_tab tbody tr:last')
		editMod(true)
	}


	/** Change **/

	// Mode change for all 
	function changeModFull(etat = true){
		$(".tr_ope, .tr_add").each(function(index, value){
			toggleInputDiv($(this), etat)
		})
		controlOperation()
	}

	// Toggle form <-> noForm
	function toggleInputDiv(tr, divToInput = true){

		// Stop si ajout non défini
		if (tr.hasClass('tr_add') && tr.find('.inputNumber').length > 0 && tr.find('.inputAnticipe').length > 0){ return false }

		// Show
		if (divToInput){

			// Stop si déja visible
			if (tr.find('.inputComment').length > 0){ return false }

			let 
				daysInMonth = $('#operation_tab tbody').data('daysinmonth'),

				td_number = tr.find('.td_number'),
				td_anticipe = tr.find('.td_anticipe'),
				td_date = tr.find('.td_date'),
				td_comment = tr.find('.td_comment'),

				number = td_number.text().trim(),
				anticipe = td_anticipe.text().trim(),
				date = td_date.text().split('/'),
				comment = td_comment.text().trim(),

				input_number = "<input class='inputNumber' type='number' step='0.01' value='" + number + "' min='0' />",
				input_anticipe = "<input class='inputAnticipe' type='number' step='0.01' value='" + anticipe + "' min='0' />",
				input_date = "<select class='inputDay'/>",
				input_comment = "<input class='inputComment' type='text' value='" + comment + "' />"
			;

			// Switch + Actions
			tr.find('.switch, .btn-group').prop('disabled', false).show()

			// Noform
			tr.find('.btn-group .noForm').removeClass('invalid')

			// Number
			if (number != ''){ td_number.empty().append(input_number) }

			// Anticipe
			if (anticipe != ''){ td_anticipe.empty().append(input_anticipe) }

			// Date
			for (var i = 1; i <= daysInMonth; i++){

				let loopFirst = i == date[0]
					? 'selected'
					: ''

				input_date = input_date + "<option value='" + i + "' " + loopFirst + ">" + i + "</option>"
			}
			input_date = input_date + "</select>/"+ date[1] + "/" + date[2]
			td_date.empty().append(input_date)

			// Comment
			td_comment.empty().append(input_comment)

		// Hide
		} else {

			// Stop si déja visible
			if (tr.find('.inputComment').length == 0){ return false }

			let
				inputNumber = tr.find('.inputNumber'),
				inputAnticipe = tr.find('.inputAnticipe'),
				inputNumberVal = inputNumber.val() == null ? '' : correctNumber(inputNumber.val()),
				inputAnticipeVal = inputAnticipe.val() == null ? '' : correctNumber(inputAnticipe.val()),
				inputDay = tr.find('.inputDay'),
				inputComment = tr.find('.inputComment'),
				day = inputDay.val()
			;

			// Switch + Action
			tr.find('.switch, .btn-group').prop('disabled', true).hide()

			inputNumber.after(inputNumberVal).remove()
			inputAnticipe.after(inputAnticipeVal).remove()
			inputDay.after(day < 10 ? '0'+ day : day).remove()
			inputComment.after(inputComment.val()).remove()
		}
	}

	// Toggle input Number <-> Anticipe
	function toggleInputNumberAnticipe(tr){
		let
			input = tr.find('input'),
			val = input.val(),
			clas = input.attr('class')
		;

		// Add anticipe
		if (clas == 'inputNumber'){
			tr.find('.td_anticipe').append("<input class='inputAnticipe' type='number' step='0.01' value='"+val+"' min='0' />")
			tr.find('.td_number').empty()

		// Add number
		} else if(clas == 'inputAnticipe'){
			tr.find('.td_number').append("<input class='inputNumber' type='number' step='0.01' value='"+val+"' min='0' />")
			tr.find('.td_anticipe').empty()
		}
		controlOperation()
		calculSolde()
		checkEditMod()
	}

	// Mise à jour du solde
	function calculSolde(){

		let
			sign = $('#operation_tab tbody').data('sign'),
			counterSign = sign == 'pos' ? 'neg' : 'pos',
			solde_fait = 0,
			solde_anticipe = 0
		;

		// Sous-total
		$(".td_number").each(function(index, value){
			if ($(this).is(":visible")){

				let val = $(this).find('.inputNumber').val()

				solde_fait = val != undefined && val != ''
					? solde_fait + parseFloat(val)
					: $(this).text().trim() != ''
						? solde_fait + parseFloat($(this).text())
						: solde_fait
			}
		})

		$(".td_anticipe").each(function(index, value){
			if ($(this).is(":visible")){

				let val = $(this).find('.inputAnticipe').val()

				solde_anticipe = val != undefined && val != ''
					? solde_anticipe + parseFloat(val)
					: $(this).text().trim() != ''
						? solde_anticipe + parseFloat($(this).text())
						: solde_anticipe
			}
		})

		// Math
		solde_fait = Math.round((solde_fait)*100)/100
		solde_anticipe = Math.round((solde_anticipe)*100)/100

		solde_fait = correctNumber(solde_fait)
		solde_anticipe = correctNumber(solde_anticipe)

		$('#soldeReel').text(solde_fait)
		$('#soldeAnticipe').text(solde_anticipe)
		$('#solde').text(Math.round((parseFloat(solde_fait) + parseFloat(solde_anticipe))*100)/100)

		// Color Reel
		$('#soldeReel').addClass('total_month_detail_'+ sign).removeClass('total_month_detail_' + counterSign)
	}


	/** Édition **/

	// Mode édition
	function editMod(etat){

		// ON
		if (etat){
			$('.modal-footer').show()
			$('#modalOperationSaveClose, #cancel_operation').prop('disabled', false).show()

		// OFF
		} else {
			$('.tr_add').remove()
			$('#modalOperationFullEdit').prop('disabled', false)
			$('#modalOperationSaveClose, .delete').prop('disabled', true).hide()
			$('#saveAdd, .delete, #cancel_operation, .inputRetrait').prop('disabled', true).hide()
			$('#close').prop('disabled', false).prop('title', 'Fermer la fenêtre')
			$('.modal-footer').hide()
			calculSolde()
		}
	}

	// Check Si Édition en cours (Alerte visuelle + editMod)
	function checkEditMod(isEditMod = false){

		// Pas d'alerte si addMod
		if ($('#operation_tab .tr_add').length == 1){
			isEditMod = true
		}

		// Check Number + Anticipe
		$('#operation_tab .tr_ope').each(function(index, div){

			let id = div.id

			// Correct Number
			if (
				(
					$('#' + id + ' .inputNumber').length == 1 &&
					_input_datas[id + '_number'] != $('#' + id + ' .inputNumber').val()
				) ||
				(
					$('#' + id + ' .inputNumber').length == 0 &&
					_input_datas[id + '_number'] != $('#' + id + ' .td_number').text().trim()
				)
			){
				isEditMod = true
			}

			// Correct Anticipe
			if (
				(
					$('#' + id + ' .inputAnticipe').length == 1 &&
					_input_datas[id + '_number'] != $('#' + id + ' .inputAnticipe').val()
				) ||
				(
					$('#' + id + ' .inputAnticipe').length == 0 &&
					_input_datas[id + '_anticipe'] != $('#' + id + ' ._anticipe').text().trim()
				)
			){
				isEditMod = true
			}

			// Date

			// Comment


		})

		// Toutes les rows sont présentes ?

		// Check EditMod
		editMod(isEditMod)
	}


	/** Utilitaire **/

	// Renvoie un nombre avec 2 chiffres après la virgule
	function correctNumber(number){
		return parseFloat(number) % 1 == 0
			? parseFloat(number)
			: parseFloat(number).toFixed(2)
	}


	/** Sauvegarde **/

	function controlOperation(){

		let
			control = true,
			checkChange = false
		;

		$("#operation_tab tbody tr").not('#solde_tr_collabo, #tr_solde').each(function(index, value){

			let
				switch_icon = $(this).find('.switch'),
				input_number = $(this).find('.inputNumber'),
				input_anticipe = $(this).find('.inputAnticipe'),
				input_number_val = input_number.val(),
				input_anticipe_val = input_anticipe.val()
			;

			// 2 Input existants
			if (input_number_val != undefined && input_anticipe_val != undefined){

				let input_number_valid = input_number_val == '' || input_number_val == '0' || input_number_val == 0
					? false
					: true

				let input_anticipe_valid = input_anticipe_val == '' || input_anticipe_val == '0' || input_anticipe_val == 0
					? false
					: true

				// 2 vides
				if (!input_number_valid && !input_anticipe_valid){
					input_number.addClass('alerteOpe').removeClass('alerte-doublon')
					input_anticipe.addClass('alerteOpe').removeClass('alerte-doublon')
					control = false

				// 2 remplis (ne doit plus apparaitre)
				} else if(input_number_valid && input_anticipe_valid){
					input_number.addClass('alerte-doublon').removeClass('alerteOpe')
					input_anticipe.addClass('alerte-doublon').removeClass('alerteOpe')
					control = false

				// 1 rempli et 1 vide
				} else {
					switch_icon.show()
					$(this).find('.noForm').removeClass('invalid')
					input_number_valid
						? input_anticipe.remove() && input_number.removeClass('alerteOpe').removeClass('alerte-doublon')
						: input_number.remove() && input_anticipe.removeClass('alerteOpe').removeClass('alerte-doublon')
				}

			// Only Number valid
			} else if(input_number_val != undefined && input_anticipe_val == undefined){

				let input_number_valid = input_number_val == '' || input_number_val == '0' || input_number_val == 0
					? false
					: true

				if (input_number_valid){
					input_number.removeClass('alerteOpe').removeClass('alerte-doublon')
					switch_icon.show()
				} else {
					input_number.addClass('alerteOpe').removeClass('alerte-doublon')
					switch_icon.hide()
					$("#operation_tab tbody .alerteOpe:first").focus()
					control = false
				}
				checkChange = true

			// Only Anticipe valid
			} else if(input_number_val == undefined && input_anticipe_val != undefined){

				let input_anticipe_valid = input_anticipe_val == '' || input_anticipe_val == '0' || input_anticipe_val == 0
					? false
					: true

				if (input_anticipe_valid){
					input_anticipe.removeClass('alerteOpe').removeClass('alerte-doublon')
					switch_icon.show()
				} else {
					input_anticipe.addClass('alerteOpe').removeClass('alerte-doublon')
					switch_icon.hide()
					$("#operation_tab tbody .alerteOpe:first").focus()
					control = false
				}
				checkChange = true
			}
		})

		// Button Statut
		checkChange
			? $('#modalOperationFullEdit').val(1).text("Fin d'édition")
			: $('#modalOperationFullEdit').val(0).text("Édition")

		return control
	}

	function sauvegarde(){

		let
			datas = [],
			sc_id = $('#operation_tab tbody').data('scid'),
			month = $('#operation_tab tbody').data('month'),
			year = $('#operation_tab tbody').data('year'),
			sign = $('#operation_tab tbody').data('sign')
		;

		$("#operation_tab tbody tr").not('#solde_tr_collabo, #tr_solde').each(function(index, value){

			let
				id_array = value.id.split('_'),
				id = id_array[2] ? id_array[2] : null,
				number = $(this).find('.inputNumber').val() == undefined ? $(this).find('.td_number').text() : parseFloat($(this).find('.inputNumber').val()).toFixed(2),
				number_anticipe = $(this).find('.inputAnticipe').val() == undefined ? $(this).find('.td_anticipe').text() : parseFloat($(this).find('.inputAnticipe').val()).toFixed(2),
				day = $(this).find('.inputDay').val() == undefined ? $(this).find('.td_date').text().substring(0, 2) : $(this).find('.inputDay').val(),
				comment = $(this).find('.inputComment').val() == undefined ? $(this).find('.td_comment').text() : $(this).find('.inputComment').val()
			;

			if (number != null || number_anticipe != null){
				datas.push({
					id: id,
					number: number,
					number_anticipe: number_anticipe,
					day: day,
					month: month,
					year: year,
					comment: comment,
				})
			}
		})

		$.ajax({
			type: "POST",
			url: Routing.generate('compte_operation_save', { sc: sc_id, year: year, month: month, sign: sign }),
			data: { datas: datas },
			dataType: 'JSON',
			timeout: 15000,
			beforeSend: function(){

			},
			success: function(response){
				if (response.save == true){
					_save_operations = response.operations
				}
				updateTable()
			},
			error: function(error){
				console.log('Erreur ajax: ' + error)
			}
		})
	}
})