<?php

namespace App\Form;

use App\Entity\UserPreference;

use Symfony\Component\Form\Extension\Core\Type\CheckboxType;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class UserPreferenceType extends AbstractType
{
	public function buildForm(FormBuilderInterface $builder, array $options): void
	{
		$builder

			->add(
				'compteGenreShow',
				CheckboxType::class,
				[
					'required' => false,
					'label' => 'Montrer les genres ?',
					'attr' => [
						'class' => 'checkType',
					],
				]
			)
		;
	}

	public function configureOptions(OptionsResolver $resolver): void
	{
		$resolver->setDefaults([
			'data_class' => UserPreference::class,
		]);
	}
}
